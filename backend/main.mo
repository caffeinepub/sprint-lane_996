import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Char "mo:core/Char";

actor {
  // ==================== Type Definitions ====================

  type Board = {
    id : Nat;
    name : Text;
    ownerId : Principal;
    createdAt : Time.Time;
  };

  type Column = {
    id : Nat;
    boardId : Nat;
    name : Text;
    position : Nat;
    createdAt : Time.Time;
  };

  type Card = {
    id : Nat;
    columnId : Nat;
    boardId : Nat;
    title : Text;
    description : Text;
    tags : [Nat];
    assigneeId : ?Principal;
    position : Nat;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type BoardMember = {
    boardId : Nat;
    userId : Principal;
    role : Text; // "owner" or "member"
    joinedAt : Time.Time;
  };

  type Tag = {
    id : Nat;
    boardId : Nat;
    name : Text;
    color : Text;
  };

  type BoardWithDetails = {
    board : Board;
    columns : [ColumnWithCards];
    members : [BoardMember];
    tags : [Tag];
  };

  type ColumnWithCards = {
    column : Column;
    cards : [Card];
  };

  type BoardInvite = {
    id : Nat;
    boardId : Nat;
    inviteCode : Text;
    createdAt : Time.Time;
  };

  type InviteDetails = {
    boardName : Text;
    memberCount : Nat;
  };

  type UserProfile = {
    userId : Principal;
    username : Text;
    email : Text;
    createdAt : Time.Time;
  };

  type UserSearchResult = {
    userId : Principal;
    username : Text;
  };

  // ==================== Storage ====================

  var nextBoardId : Nat = 1;
  var nextColumnId : Nat = 1;
  var nextCardId : Nat = 1;
  var nextTagId : Nat = 1;
  var nextInviteId : Nat = 1;

  // Maps for data storage
  var boardsMap : Map.Map<Nat, Board> = Map.empty<Nat, Board>();
  var columnsMap : Map.Map<Nat, Column> = Map.empty<Nat, Column>();
  var cardsMap : Map.Map<Nat, Card> = Map.empty<Nat, Card>();
  var boardMembersMap : Map.Map<Text, BoardMember> = Map.empty<Text, BoardMember>();
  var tagsMap : Map.Map<Nat, Tag> = Map.empty<Nat, Tag>();
  var inviteCodesMap : Map.Map<Text, BoardInvite> = Map.empty<Text, BoardInvite>();

  // User profile storage
  var userProfilesMap : Map.Map<Text, UserProfile> = Map.empty<Text, UserProfile>(); // key: principal text
  var usernameIndexMap : Map.Map<Text, Principal> = Map.empty<Text, Principal>(); // key: lowercase username
  var emailIndexMap : Map.Map<Text, Principal> = Map.empty<Text, Principal>(); // key: lowercase email

  // ==================== Helper Functions ====================

  func requireAuth(caller : Principal) : () {
    if (caller.isAnonymous()) {
      Runtime.trap("Authentication required");
    };
  };

  func memberKey(boardId : Nat, principal : Principal) : Text {
    boardId.toText() # "-" # principal.toText();
  };

  func isBoardMember(boardId : Nat, principal : Principal) : Bool {
    let key = memberKey(boardId, principal);
    switch (boardMembersMap.get(key)) {
      case (?_) { true };
      case (null) { false };
    };
  };

  func isBoardOwner(boardId : Nat, principal : Principal) : Bool {
    let key = memberKey(boardId, principal);
    switch (boardMembersMap.get(key)) {
      case (?member) { member.role == "owner" };
      case (null) { false };
    };
  };

  func generateInviteCode() : Text {
    let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let charsArr = chars.chars().toArray();
    let timestamp = Int.abs(Time.now());
    var code = "";
    var seed = timestamp;
    var i = 0;
    while (i < 8) {
      let index = seed % 32;
      code #= Text.fromChar(charsArr[index]);
      seed := (seed / 32) + (timestamp / (i + 1));
      i += 1;
    };
    let arr = code.chars().toArray();
    Text.fromIter(Array.tabulate<Char>(4, func(i) { arr[i] }).vals()) # "-" # Text.fromIter(Array.tabulate<Char>(4, func(i) { arr[i + 4] }).vals());
  };

  func countBoardMembers(boardId : Nat) : Nat {
    var count : Nat = 0;
    let allMembers = boardMembersMap.values().toArray();
    for (member in allMembers.vals()) {
      if (member.boardId == boardId) {
        count += 1;
      };
    };
    count;
  };

  func trimText(t : Text) : Text {
    let chars = t.chars().toArray();
    let len = chars.size();
    if (len == 0) { return "" };

    var start = 0;
    while (start < len and chars[start] == ' ') { start += 1 };

    var end = len;
    while (end > start and chars[end - 1] == ' ') { end -= 1 };

    if (start >= end) { return "" };

    var result = "";
    var i = start;
    while (i < end) {
      result #= Text.fromChar(chars[i]);
      i += 1;
    };
    result;
  };

  func toLower(t : Text) : Text {
    var result = "";
    for (c in t.chars()) {
      let code = c.toNat32();
      if (code >= 65 and code <= 90) {
        result #= Text.fromChar(Char.fromNat32(code + 32));
      } else {
        result #= Text.fromChar(c);
      };
    };
    result;
  };

  // ==================== Input Validation ====================

  func validateTextLength(text : Text, maxLen : Nat, fieldName : Text) : () {
    if (text.size() > maxLen) {
      Runtime.trap(fieldName # " must be " # maxLen.toText() # " characters or less");
    };
  };

  func validateNotEmpty(text : Text, fieldName : Text) : () {
    let trimmed = trimText(text);
    if (trimmed == "") {
      Runtime.trap(fieldName # " cannot be empty");
    };
  };

  func validateHexColor(color : Text) : () {
    // Must be exactly 7 chars: #RRGGBB
    if (color.size() != 7) {
      Runtime.trap("Color must be in #RRGGBB format (7 characters)");
    };
    let chars = color.chars().toArray();
    if (chars[0] != '#') {
      Runtime.trap("Color must start with #");
    };
    var i = 1;
    while (i < 7) {
      let c = chars[i];
      let code = c.toNat32();
      let isDigit = code >= 48 and code <= 57; // 0-9
      let isUpperHex = code >= 65 and code <= 70; // A-F
      let isLowerHex = code >= 97 and code <= 102; // a-f
      if (not isDigit and not isUpperHex and not isLowerHex) {
        Runtime.trap("Color must contain only hex characters (0-9, A-F)");
      };
      i += 1;
    };
  };

  // ==================== User Profile Management ====================

  public shared ({ caller }) func setUserProfile(username : Text, email : Text) : async Bool {
    requireAuth(caller);

    let trimmedUsername = trimText(username);
    let trimmedEmail = trimText(email);

    if (trimmedUsername == "" or trimmedEmail == "") {
      Runtime.trap("Username and email are required");
    };

    if (trimmedUsername.size() < 3) {
      Runtime.trap("Username must be at least 3 characters");
    };

    let lowerUsername = toLower(trimmedUsername);
    let lowerEmail = toLower(trimmedEmail);
    let callerKey = caller.toText();

    // Check username uniqueness (allow keeping own username)
    switch (usernameIndexMap.get(lowerUsername)) {
      case (?existingPrincipal) {
        if (not Principal.equal(existingPrincipal, caller)) {
          Runtime.trap("Username is already taken");
        };
      };
      case (null) {};
    };

    // Check email uniqueness (allow keeping own email)
    switch (emailIndexMap.get(lowerEmail)) {
      case (?existingPrincipal) {
        if (not Principal.equal(existingPrincipal, caller)) {
          Runtime.trap("Email is already in use");
        };
      };
      case (null) {};
    };

    // Remove old index entries if profile exists
    switch (userProfilesMap.get(callerKey)) {
      case (?oldProfile) {
        usernameIndexMap.remove(toLower(oldProfile.username));
        emailIndexMap.remove(toLower(oldProfile.email));
      };
      case (null) {};
    };

    // Save profile
    let profile : UserProfile = {
      userId = caller;
      username = trimmedUsername;
      email = trimmedEmail;
      createdAt = Time.now();
    };
    userProfilesMap.add(callerKey, profile);
    usernameIndexMap.add(lowerUsername, caller);
    emailIndexMap.add(lowerEmail, caller);

    true;
  };

  public shared query ({ caller }) func getUserProfile() : async ?UserProfile {
    requireAuth(caller);
    userProfilesMap.get(caller.toText());
  };

  public shared query ({ caller }) func hasUserProfile() : async Bool {
    requireAuth(caller);
    switch (userProfilesMap.get(caller.toText())) {
      case (?_) { true };
      case (null) { false };
    };
  };

  public shared query ({ caller }) func lookupUser(searchText : Text) : async ?UserSearchResult {
    requireAuth(caller);

    let lowerQuery = toLower(trimText(searchText));
    if (lowerQuery == "") { return null };

    // Try username first
    switch (usernameIndexMap.get(lowerQuery)) {
      case (?principal) {
        switch (userProfilesMap.get(principal.toText())) {
          case (?profile) {
            return ?{
              userId = profile.userId;
              username = profile.username;
            };
          };
          case (null) {};
        };
      };
      case (null) {};
    };

    // Try email
    switch (emailIndexMap.get(lowerQuery)) {
      case (?principal) {
        switch (userProfilesMap.get(principal.toText())) {
          case (?profile) {
            return ?{
              userId = profile.userId;
              username = profile.username;
            };
          };
          case (null) {};
        };
      };
      case (null) {};
    };

    null;
  };

  public shared query func getUserProfileByPrincipal(principal : Principal) : async ?UserProfile {
    userProfilesMap.get(principal.toText());
  };

  public shared ({ caller }) func inviteUserToBoard(boardId : Nat, targetPrincipal : Principal) : async Bool {
    requireAuth(caller);

    if (not isBoardOwner(boardId, caller)) {
      Runtime.trap("Only board owner can invite members");
    };

    // Check if already a member
    let key = memberKey(boardId, targetPrincipal);
    switch (boardMembersMap.get(key)) {
      case (?_) { Runtime.trap("User is already a member of this board") };
      case (null) {};
    };

    // Add as member
    let member : BoardMember = {
      boardId;
      userId = targetPrincipal;
      role = "member";
      joinedAt = Time.now();
    };
    boardMembersMap.add(key, member);
    true;
  };

  public shared query ({ caller }) func getBoardMemberProfiles(boardId : Nat) : async [UserProfile] {
    requireAuth(caller);

    if (not isBoardMember(boardId, caller)) {
      Runtime.trap("Not a member of this board");
    };

    var profiles : [UserProfile] = [];
    let allMembers = boardMembersMap.values().toArray();
    for (member in allMembers.vals()) {
      if (member.boardId == boardId) {
        switch (userProfilesMap.get(member.userId.toText())) {
          case (?profile) {
            profiles := profiles.concat([profile]);
          };
          case (null) {};
        };
      };
    };
    profiles;
  };

  // ==================== Board Management ====================

  public shared ({ caller }) func createBoard(name : Text) : async Nat {
    requireAuth(caller);

    // Validate input
    validateNotEmpty(name, "Board name");
    validateTextLength(name, 200, "Board name");

    let boardId = nextBoardId;
    nextBoardId += 1;

    let now = Time.now();

    // Create the board
    let board : Board = {
      id = boardId;
      name = trimText(name);
      ownerId = caller;
      createdAt = now;
    };
    boardsMap.add(boardId, board);

    // Add caller as owner
    let ownerMember : BoardMember = {
      boardId;
      userId = caller;
      role = "owner";
      joinedAt = now;
    };
    let key = memberKey(boardId, caller);
    boardMembersMap.add(key, ownerMember);

    // Create default columns
    let defaultColumns = ["To Do", "In Progress", "Done"];
    var position = 0;
    for (colName in defaultColumns.vals()) {
      let colId = nextColumnId;
      nextColumnId += 1;

      let col : Column = {
        id = colId;
        boardId;
        name = colName;
        position;
        createdAt = now;
      };
      columnsMap.add(colId, col);
      position += 1;
    };

    boardId;
  };

  public shared query ({ caller }) func getMyBoards() : async [Board] {
    requireAuth(caller);

    let memberEntries = boardMembersMap.values().toArray();
    var userBoardIds : [Nat] = [];

    for (member in memberEntries.vals()) {
      if (Principal.equal(member.userId, caller)) {
        userBoardIds := userBoardIds.concat([member.boardId]);
      };
    };

    var result : [Board] = [];
    for (boardId in userBoardIds.vals()) {
      switch (boardsMap.get(boardId)) {
        case (?board) { result := result.concat([board]) };
        case (null) {};
      };
    };

    result;
  };

  public shared query ({ caller }) func getBoard(boardId : Nat) : async ?BoardWithDetails {
    requireAuth(caller);

    if (not isBoardMember(boardId, caller)) {
      Runtime.trap("Not a member of this board");
    };

    switch (boardsMap.get(boardId)) {
      case (null) { null };
      case (?board) {
        // Get columns for this board
        let allColumns = columnsMap.values().toArray();
        var boardColumns : [Column] = [];
        for (col in allColumns.vals()) {
          if (col.boardId == boardId) {
            boardColumns := boardColumns.concat([col]);
          };
        };

        // Sort columns by position
        boardColumns := boardColumns.sort(
          func(a, b) {
            if (a.position < b.position) { #less } else if (a.position > b.position) {
              #greater;
            } else { #equal };
          }
        );

        // Get cards for each column
        var columnsWithCards : [ColumnWithCards] = [];
        let allCards = cardsMap.values().toArray();
        for (col in boardColumns.vals()) {
          var colCards : [Card] = [];
          for (card in allCards.vals()) {
            if (card.columnId == col.id) {
              colCards := colCards.concat([card]);
            };
          };

          // Sort cards by position
          colCards := colCards.sort(
            func(a, b) {
              if (a.position < b.position) { #less } else if (a.position > b.position) {
                #greater;
              } else { #equal };
            }
          );

          columnsWithCards := columnsWithCards.concat([{
            column = col;
            cards = colCards;
          }]);
        };

        // Get members
        var boardMembersList : [BoardMember] = [];
        let allMembers = boardMembersMap.values().toArray();
        for (member in allMembers.vals()) {
          if (member.boardId == boardId) {
            boardMembersList := boardMembersList.concat([member]);
          };
        };

        // Get tags
        var boardTags : [Tag] = [];
        let allTags = tagsMap.values().toArray();
        for (tag in allTags.vals()) {
          if (tag.boardId == boardId) {
            boardTags := boardTags.concat([tag]);
          };
        };

        ?{
          board;
          columns = columnsWithCards;
          members = boardMembersList;
          tags = boardTags;
        };
      };
    };
  };

  public shared ({ caller }) func updateBoard(boardId : Nat, name : Text) : async Bool {
    requireAuth(caller);

    // Validate input
    validateNotEmpty(name, "Board name");
    validateTextLength(name, 200, "Board name");

    if (not isBoardOwner(boardId, caller)) {
      Runtime.trap("Only board owner can update board");
    };

    switch (boardsMap.get(boardId)) {
      case (null) { false };
      case (?board) {
        let updated : Board = {
          id = board.id;
          name = trimText(name);
          ownerId = board.ownerId;
          createdAt = board.createdAt;
        };
        boardsMap.add(boardId, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteBoard(boardId : Nat) : async Bool {
    requireAuth(caller);

    if (not isBoardOwner(boardId, caller)) {
      Runtime.trap("Only board owner can delete board");
    };

    // Delete the board
    boardsMap.remove(boardId);

    // Delete all columns for this board
    let allColumns = columnsMap.entries().toArray();
    var colsToDelete : [Nat] = [];
    for ((colId, col) in allColumns.vals()) {
      if (col.boardId == boardId) {
        colsToDelete := colsToDelete.concat([colId]);
      };
    };
    for (colId in colsToDelete.vals()) {
      columnsMap.remove(colId);
    };

    // Delete all cards for this board
    let allCards = cardsMap.entries().toArray();
    var cardsToDelete : [Nat] = [];
    for ((cardId, card) in allCards.vals()) {
      if (card.boardId == boardId) {
        cardsToDelete := cardsToDelete.concat([cardId]);
      };
    };
    for (cardId in cardsToDelete.vals()) {
      cardsMap.remove(cardId);
    };

    // Delete all members for this board
    let allMembers = boardMembersMap.entries().toArray();
    var membersToDelete : [Text] = [];
    for ((key, member) in allMembers.vals()) {
      if (member.boardId == boardId) {
        membersToDelete := membersToDelete.concat([key]);
      };
    };
    for (key in membersToDelete.vals()) {
      boardMembersMap.remove(key);
    };

    // Delete all tags for this board
    let allTags = tagsMap.entries().toArray();
    var tagsToDelete : [Nat] = [];
    for ((tagId, tag) in allTags.vals()) {
      if (tag.boardId == boardId) {
        tagsToDelete := tagsToDelete.concat([tagId]);
      };
    };
    for (tagId in tagsToDelete.vals()) {
      tagsMap.remove(tagId);
    };

    // Delete all invite codes for this board
    let allInvites = inviteCodesMap.entries().toArray();
    var invitesToDelete : [Text] = [];
    for ((code, invite) in allInvites.vals()) {
      if (invite.boardId == boardId) {
        invitesToDelete := invitesToDelete.concat([code]);
      };
    };
    for (code in invitesToDelete.vals()) {
      inviteCodesMap.remove(code);
    };

    true;
  };

  // ==================== Column Management ====================

  public shared ({ caller }) func createColumn(boardId : Nat, name : Text) : async Nat {
    requireAuth(caller);

    // Validate input
    validateNotEmpty(name, "Column name");
    validateTextLength(name, 100, "Column name");

    if (not isBoardMember(boardId, caller)) {
      Runtime.trap("Not a member of this board");
    };

    // Find max position in board
    var maxPos : Nat = 0;
    let allColumns = columnsMap.values().toArray();
    for (col in allColumns.vals()) {
      if (col.boardId == boardId and col.position >= maxPos) {
        maxPos := col.position + 1;
      };
    };

    let colId = nextColumnId;
    nextColumnId += 1;

    let col : Column = {
      id = colId;
      boardId;
      name = trimText(name);
      position = maxPos;
      createdAt = Time.now();
    };
    columnsMap.add(colId, col);

    colId;
  };

  public shared ({ caller }) func updateColumn(columnId : Nat, name : Text) : async Bool {
    requireAuth(caller);

    // Validate input
    validateNotEmpty(name, "Column name");
    validateTextLength(name, 100, "Column name");

    switch (columnsMap.get(columnId)) {
      case (null) { false };
      case (?col) {
        if (not isBoardMember(col.boardId, caller)) {
          Runtime.trap("Not a member of this board");
        };

        let updated : Column = {
          id = col.id;
          boardId = col.boardId;
          name = trimText(name);
          position = col.position;
          createdAt = col.createdAt;
        };
        columnsMap.add(columnId, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func reorderColumns(boardId : Nat, columnIds : [Nat]) : async Bool {
    requireAuth(caller);

    if (not isBoardMember(boardId, caller)) {
      Runtime.trap("Not a member of this board");
    };

    // Update position for each column based on array order
    var position : Nat = 0;
    for (colId in columnIds.vals()) {
      switch (columnsMap.get(colId)) {
        case (null) {}; // Skip invalid IDs
        case (?col) {
          if (col.boardId == boardId) {
            let updated : Column = {
              id = col.id;
              boardId = col.boardId;
              name = col.name;
              position;
              createdAt = col.createdAt;
            };
            columnsMap.add(colId, updated);
            position += 1;
          };
        };
      };
    };
    true;
  };

  public shared ({ caller }) func deleteColumn(columnId : Nat) : async Bool {
    requireAuth(caller);

    switch (columnsMap.get(columnId)) {
      case (null) { false };
      case (?col) {
        if (not isBoardMember(col.boardId, caller)) {
          Runtime.trap("Not a member of this board");
        };

        // Delete the column
        columnsMap.remove(columnId);

        // Delete all cards in this column
        let allCards = cardsMap.entries().toArray();
        var cardsToDelete : [Nat] = [];
        for ((cardId, card) in allCards.vals()) {
          if (card.columnId == columnId) {
            cardsToDelete := cardsToDelete.concat([cardId]);
          };
        };
        for (cardId in cardsToDelete.vals()) {
          cardsMap.remove(cardId);
        };

        true;
      };
    };
  };

  // ==================== Card Management ====================

  public shared ({ caller }) func createCard(columnId : Nat, title : Text, description : Text, tagIds : [Nat], assigneeId : ?Principal) : async Nat {
    requireAuth(caller);

    // Validate input
    validateNotEmpty(title, "Card title");
    validateTextLength(title, 200, "Card title");
    validateTextLength(description, 5000, "Card description");

    switch (columnsMap.get(columnId)) {
      case (null) { Runtime.trap("Column not found") };
      case (?col) {
        if (not isBoardMember(col.boardId, caller)) {
          Runtime.trap("Not a member of this board");
        };

        let cardId = nextCardId;
        nextCardId += 1;

        let now = Time.now();

        let card : Card = {
          id = cardId;
          columnId;
          boardId = col.boardId;
          title = trimText(title);
          description = trimText(description);
          tags = tagIds;
          assigneeId;
          position = 0; // Add at top
          createdAt = now;
          updatedAt = now;
        };

        // Shift existing cards down
        let allCards = cardsMap.entries().toArray();
        for ((existingId, existingCard) in allCards.vals()) {
          if (existingCard.columnId == columnId) {
            let shifted : Card = {
              id = existingCard.id;
              columnId = existingCard.columnId;
              boardId = existingCard.boardId;
              title = existingCard.title;
              description = existingCard.description;
              tags = existingCard.tags;
              assigneeId = existingCard.assigneeId;
              position = existingCard.position + 1;
              createdAt = existingCard.createdAt;
              updatedAt = existingCard.updatedAt;
            };
            cardsMap.add(existingId, shifted);
          };
        };

        cardsMap.add(cardId, card);

        cardId;
      };
    };
  };

  public shared ({ caller }) func updateCard(cardId : Nat, title : Text, description : Text, tagIds : [Nat], assigneeId : ?Principal) : async Bool {
    requireAuth(caller);

    // Validate input
    validateNotEmpty(title, "Card title");
    validateTextLength(title, 200, "Card title");
    validateTextLength(description, 5000, "Card description");

    switch (cardsMap.get(cardId)) {
      case (null) { false };
      case (?card) {
        if (not isBoardMember(card.boardId, caller)) {
          Runtime.trap("Not a member of this board");
        };

        let updated : Card = {
          id = card.id;
          columnId = card.columnId;
          boardId = card.boardId;
          title = trimText(title);
          description = trimText(description);
          tags = tagIds;
          assigneeId;
          position = card.position;
          createdAt = card.createdAt;
          updatedAt = Time.now();
        };
        cardsMap.add(cardId, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func moveCard(cardId : Nat, targetColumnId : Nat, newPosition : Nat) : async Bool {
    requireAuth(caller);

    switch (cardsMap.get(cardId)) {
      case (null) { false };
      case (?card) {
        if (not isBoardMember(card.boardId, caller)) {
          Runtime.trap("Not a member of this board");
        };

        let updated : Card = {
          id = card.id;
          columnId = targetColumnId;
          boardId = card.boardId;
          title = card.title;
          description = card.description;
          tags = card.tags;
          assigneeId = card.assigneeId;
          position = newPosition;
          createdAt = card.createdAt;
          updatedAt = Time.now();
        };
        cardsMap.add(cardId, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func reorderCards(columnId : Nat, cardIds : [Nat]) : async Bool {
    requireAuth(caller);

    // Get the column to verify board membership
    switch (columnsMap.get(columnId)) {
      case (null) { Runtime.trap("Column not found") };
      case (?col) {
        if (not isBoardMember(col.boardId, caller)) {
          Runtime.trap("Not a member of this board");
        };

        // Update position for each card based on array order
        var position : Nat = 0;
        for (cardId in cardIds.vals()) {
          switch (cardsMap.get(cardId)) {
            case (null) {}; // Skip invalid IDs
            case (?card) {
              if (card.columnId == columnId) {
                let updated : Card = {
                  id = card.id;
                  columnId = card.columnId;
                  boardId = card.boardId;
                  title = card.title;
                  description = card.description;
                  tags = card.tags;
                  assigneeId = card.assigneeId;
                  position;
                  createdAt = card.createdAt;
                  updatedAt = Time.now();
                };
                cardsMap.add(cardId, updated);
                position += 1;
              };
            };
          };
        };
        true;
      };
    };
  };

  public shared ({ caller }) func deleteCard(cardId : Nat) : async Bool {
    requireAuth(caller);

    switch (cardsMap.get(cardId)) {
      case (null) { false };
      case (?card) {
        if (not isBoardMember(card.boardId, caller)) {
          Runtime.trap("Not a member of this board");
        };

        cardsMap.remove(cardId);
        true;
      };
    };
  };

  // ==================== Team Collaboration ====================

  public shared ({ caller }) func generateBoardInvite(boardId : Nat) : async Text {
    requireAuth(caller);

    if (not isBoardOwner(boardId, caller)) {
      Runtime.trap("Only board owner can generate invites");
    };

    switch (boardsMap.get(boardId)) {
      case (null) { Runtime.trap("Board not found") };
      case (?_) {};
    };

    let code = generateInviteCode();
    let invite : BoardInvite = {
      id = nextInviteId;
      boardId;
      inviteCode = code;
      createdAt = Time.now();
    };
    nextInviteId += 1;
    inviteCodesMap.add(code, invite);
    code;
  };

  public shared query func getInviteDetails(code : Text) : async ?InviteDetails {
    switch (inviteCodesMap.get(code)) {
      case (null) { null };
      case (?invite) {
        switch (boardsMap.get(invite.boardId)) {
          case (null) { null };
          case (?board) {
            ?{
              boardName = board.name;
              memberCount = countBoardMembers(invite.boardId);
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func joinBoardWithCode(code : Text) : async Nat {
    requireAuth(caller);

    switch (inviteCodesMap.get(code)) {
      case (null) { Runtime.trap("Invalid or expired invite code") };
      case (?invite) {
        let key = memberKey(invite.boardId, caller);

        // Check if already a member
        switch (boardMembersMap.get(key)) {
          case (?_) { Runtime.trap("Already a member of this board") };
          case (null) {};
        };

        // Add as member
        let member : BoardMember = {
          boardId = invite.boardId;
          userId = caller;
          role = "member";
          joinedAt = Time.now();
        };
        boardMembersMap.add(key, member);

        // Remove invite code (single-use)
        inviteCodesMap.remove(code);

        invite.boardId;
      };
    };
  };

  public shared query ({ caller }) func getBoardInvites(boardId : Nat) : async [BoardInvite] {
    requireAuth(caller);

    if (not isBoardOwner(boardId, caller)) {
      Runtime.trap("Only board owner can view invites");
    };

    var invites : [BoardInvite] = [];
    let allInvites = inviteCodesMap.values().toArray();
    for (invite in allInvites.vals()) {
      if (invite.boardId == boardId) {
        invites := invites.concat([invite]);
      };
    };
    invites;
  };

  public shared ({ caller }) func revokeInvite(code : Text) : async Bool {
    requireAuth(caller);

    switch (inviteCodesMap.get(code)) {
      case (null) { false };
      case (?invite) {
        if (not isBoardOwner(invite.boardId, caller)) {
          Runtime.trap("Only board owner can revoke invites");
        };
        inviteCodesMap.remove(code);
        true;
      };
    };
  };

  public shared ({ caller }) func removeMember(boardId : Nat, principalId : Principal) : async Bool {
    requireAuth(caller);

    if (not isBoardOwner(boardId, caller)) {
      Runtime.trap("Only board owner can remove members");
    };

    // Cannot remove the owner
    if (Principal.equal(principalId, caller)) {
      Runtime.trap("Cannot remove yourself as owner");
    };

    let key = memberKey(boardId, principalId);
    boardMembersMap.remove(key);
    true;
  };

  public shared query ({ caller }) func getBoardMembers(boardId : Nat) : async [BoardMember] {
    requireAuth(caller);

    if (not isBoardMember(boardId, caller)) {
      Runtime.trap("Not a member of this board");
    };

    var members : [BoardMember] = [];
    let allMembers = boardMembersMap.values().toArray();
    for (member in allMembers.vals()) {
      if (member.boardId == boardId) {
        members := members.concat([member]);
      };
    };
    members;
  };

  public shared ({ caller }) func leaveBoard(boardId : Nat) : async Bool {
    requireAuth(caller);

    // Cannot leave if you're the owner
    if (isBoardOwner(boardId, caller)) {
      Runtime.trap("Board owner cannot leave. Transfer ownership or delete the board.");
    };

    let key = memberKey(boardId, caller);
    boardMembersMap.remove(key);
    true;
  };

  public shared ({ caller }) func transferOwnership(boardId : Nat, newOwnerId : Principal) : async Bool {
    requireAuth(caller);

    // Only current owner can transfer
    if (not isBoardOwner(boardId, caller)) {
      Runtime.trap("Only board owner can transfer ownership");
    };

    // New owner must be a current member
    let newOwnerKey = memberKey(boardId, newOwnerId);
    switch (boardMembersMap.get(newOwnerKey)) {
      case (null) {
        Runtime.trap("New owner must be an existing member of the board");
      };
      case (?newMember) {
        // Update board's ownerId
        switch (boardsMap.get(boardId)) {
          case (null) { Runtime.trap("Board not found") };
          case (?board) {
            let updatedBoard : Board = {
              id = board.id;
              name = board.name;
              ownerId = newOwnerId;
              createdAt = board.createdAt;
            };
            boardsMap.add(boardId, updatedBoard);
          };
        };

        // Update old owner's role to member
        let oldOwnerKey = memberKey(boardId, caller);
        switch (boardMembersMap.get(oldOwnerKey)) {
          case (null) {};
          case (?oldMember) {
            let updatedOldMember : BoardMember = {
              boardId = oldMember.boardId;
              userId = oldMember.userId;
              role = "member";
              joinedAt = oldMember.joinedAt;
            };
            boardMembersMap.add(oldOwnerKey, updatedOldMember);
          };
        };

        // Update new owner's role to owner
        let updatedNewMember : BoardMember = {
          boardId = newMember.boardId;
          userId = newMember.userId;
          role = "owner";
          joinedAt = newMember.joinedAt;
        };
        boardMembersMap.add(newOwnerKey, updatedNewMember);

        true;
      };
    };
  };

  // ==================== Tag Management ====================

  public shared ({ caller }) func createTag(boardId : Nat, name : Text, color : Text) : async Nat {
    requireAuth(caller);

    // Validate input
    validateNotEmpty(name, "Tag name");
    validateTextLength(name, 50, "Tag name");
    validateHexColor(color);

    if (not isBoardMember(boardId, caller)) {
      Runtime.trap("Not a member of this board");
    };

    let tagId = nextTagId;
    nextTagId += 1;

    let tag : Tag = {
      id = tagId;
      boardId;
      name = trimText(name);
      color;
    };
    tagsMap.add(tagId, tag);

    tagId;
  };

  public shared ({ caller }) func updateTag(tagId : Nat, name : Text, color : Text) : async Bool {
    requireAuth(caller);

    // Validate input
    validateNotEmpty(name, "Tag name");
    validateTextLength(name, 50, "Tag name");
    validateHexColor(color);

    switch (tagsMap.get(tagId)) {
      case (null) { false };
      case (?tag) {
        if (not isBoardMember(tag.boardId, caller)) {
          Runtime.trap("Not a member of this board");
        };

        let updated : Tag = {
          id = tag.id;
          boardId = tag.boardId;
          name = trimText(name);
          color;
        };
        tagsMap.add(tagId, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteTag(tagId : Nat) : async Bool {
    requireAuth(caller);

    switch (tagsMap.get(tagId)) {
      case (null) { false };
      case (?tag) {
        if (not isBoardMember(tag.boardId, caller)) {
          Runtime.trap("Not a member of this board");
        };

        tagsMap.remove(tagId);
        true;
      };
    };
  };

  public shared query ({ caller }) func getBoardTags(boardId : Nat) : async [Tag] {
    requireAuth(caller);

    if (not isBoardMember(boardId, caller)) {
      Runtime.trap("Not a member of this board");
    };

    var tagsList : [Tag] = [];
    let allTags = tagsMap.values().toArray();
    for (tag in allTags.vals()) {
      if (tag.boardId == boardId) {
        tagsList := tagsList.concat([tag]);
      };
    };
    tagsList;
  };

  // ==================== Export ====================

  public shared query ({ caller }) func exportBoardCSV(boardId : Nat) : async Text {
    requireAuth(caller);

    if (not isBoardMember(boardId, caller)) {
      Runtime.trap("Not a member of this board");
    };

    // CSV header
    var csv = "Title,Description,Column,Tags,Assignee\n";

    // Get all columns for this board
    let allColumns = columnsMap.values().toArray();
    var boardColumns : [Column] = [];
    for (col in allColumns.vals()) {
      if (col.boardId == boardId) {
        boardColumns := boardColumns.concat([col]);
      };
    };

    // Sort columns by position
    boardColumns := boardColumns.sort(
      func(a, b) {
        if (a.position < b.position) { #less } else if (a.position > b.position) {
          #greater;
        } else { #equal };
      }
    );

    // Get all cards for this board
    let allCards = cardsMap.values().toArray();
    let allTags = tagsMap.values().toArray();

    // Process each column
    for (col in boardColumns.vals()) {
      // Get cards for this column
      var columnCards : [Card] = [];
      for (card in allCards.vals()) {
        if (card.columnId == col.id) {
          columnCards := columnCards.concat([card]);
        };
      };

      // Sort cards by position
      columnCards := columnCards.sort(
        func(a, b) {
          if (a.position < b.position) { #less } else if (a.position > b.position) {
            #greater;
          } else { #equal };
        }
      );

      // Add each card to CSV
      for (card in columnCards.vals()) {
        // Get tag names
        var tagNames : Text = "";
        for (tagId in card.tags.vals()) {
          for (tag in allTags.vals()) {
            if (tag.id == tagId) {
              if (tagNames != "") {
                tagNames #= "; ";
              };
              tagNames #= tag.name;
            };
          };
        };

        // Get assignee text
        let assigneeText = switch (card.assigneeId) {
          case (null) { "" };
          case (?principal) { principal.toText() };
        };

        // Escape CSV fields (wrap in quotes if contains comma or newline)
        let title = escapeCSV(card.title);
        let description = escapeCSV(card.description);
        let columnName = escapeCSV(col.name);

        csv #= title # "," # description # "," # columnName # "," # escapeCSV(tagNames) # "," # assigneeText # "\n";
      };
    };

    csv;
  };

  // Helper function to escape CSV fields - wrap in quotes, escape internal quotes,
  // and protect against formula injection (cells starting with =, +, -, @, tab, CR)
  func escapeCSV(text : Text) : Text {
    let quote = "\"";
    var escaped = quote;

    // Check first character for formula injection risk
    let chars = text.chars().toArray();
    var needsPrefix = false;
    if (chars.size() > 0) {
      let first = chars[0];
      let code = first.toNat32();
      // = (61), + (43), - (45), @ (64), Tab (9), CR (13)
      needsPrefix := code == 61 or code == 43 or code == 45 or code == 64 or code == 9 or code == 13;
    };

    // Prefix with single quote to prevent formula execution in spreadsheet apps
    if (needsPrefix) {
      escaped #= "'";
    };

    for (char in text.chars()) {
      let code = char.toNat32();
      // Check if char is a quote (char code 34)
      if (code == 34) {
        escaped #= quote # quote;
      } else {
        escaped #= Text.fromChar(char);
      };
    };
    escaped # quote;
  };

};
