import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BoardInvite {
    id: bigint;
    createdAt: Time;
    boardId: bigint;
    inviteCode: string;
}
export interface Board {
    id: bigint;
    ownerId: Principal;
    name: string;
    createdAt: Time;
}
export interface Tag {
    id: bigint;
    name: string;
    color: string;
    boardId: bigint;
}
export type Time = bigint;
export interface Column {
    id: bigint;
    name: string;
    createdAt: Time;
    boardId: bigint;
    position: bigint;
}
export interface Card {
    id: bigint;
    title: string;
    assigneeId?: Principal;
    createdAt: Time;
    tags: Array<bigint>;
    description: string;
    boardId: bigint;
    updatedAt: Time;
    position: bigint;
    columnId: bigint;
}
export interface InviteDetails {
    memberCount: bigint;
    boardName: string;
}
export interface BoardMember {
    userId: Principal;
    joinedAt: Time;
    role: string;
    boardId: bigint;
}
export interface ColumnWithCards {
    cards: Array<Card>;
    column: Column;
}
export interface UserSearchResult {
    username: string;
    userId: Principal;
}
export interface UserProfile {
    username: string;
    userId: Principal;
    createdAt: Time;
    email: string;
}
export interface BoardWithDetails {
    members: Array<BoardMember>;
    tags: Array<Tag>;
    board: Board;
    columns: Array<ColumnWithCards>;
}
export interface backendInterface {
    createBoard(name: string): Promise<bigint>;
    createCard(columnId: bigint, title: string, description: string, tagIds: Array<bigint>, assigneeId: Principal | null): Promise<bigint>;
    createColumn(boardId: bigint, name: string): Promise<bigint>;
    createTag(boardId: bigint, name: string, color: string): Promise<bigint>;
    deleteBoard(boardId: bigint): Promise<boolean>;
    deleteCard(cardId: bigint): Promise<boolean>;
    deleteColumn(columnId: bigint): Promise<boolean>;
    deleteTag(tagId: bigint): Promise<boolean>;
    exportBoardCSV(boardId: bigint): Promise<string>;
    generateBoardInvite(boardId: bigint): Promise<string>;
    getBoard(boardId: bigint): Promise<BoardWithDetails | null>;
    getBoardInvites(boardId: bigint): Promise<Array<BoardInvite>>;
    getBoardMemberProfiles(boardId: bigint): Promise<Array<UserProfile>>;
    getBoardMembers(boardId: bigint): Promise<Array<BoardMember>>;
    getBoardTags(boardId: bigint): Promise<Array<Tag>>;
    getInviteDetails(code: string): Promise<InviteDetails | null>;
    getMyBoards(): Promise<Array<Board>>;
    getUserProfile(): Promise<UserProfile | null>;
    getUserProfileByPrincipal(principal: Principal): Promise<UserProfile | null>;
    hasUserProfile(): Promise<boolean>;
    inviteUserToBoard(boardId: bigint, targetPrincipal: Principal): Promise<boolean>;
    joinBoardWithCode(code: string): Promise<bigint>;
    leaveBoard(boardId: bigint): Promise<boolean>;
    lookupUser(searchText: string): Promise<UserSearchResult | null>;
    moveCard(cardId: bigint, targetColumnId: bigint, newPosition: bigint): Promise<boolean>;
    removeMember(boardId: bigint, principalId: Principal): Promise<boolean>;
    reorderCards(columnId: bigint, cardIds: Array<bigint>): Promise<boolean>;
    reorderColumns(boardId: bigint, columnIds: Array<bigint>): Promise<boolean>;
    revokeInvite(code: string): Promise<boolean>;
    setUserProfile(username: string, email: string): Promise<boolean>;
    transferOwnership(boardId: bigint, newOwnerId: Principal): Promise<boolean>;
    updateBoard(boardId: bigint, name: string): Promise<boolean>;
    updateCard(cardId: bigint, title: string, description: string, tagIds: Array<bigint>, assigneeId: Principal | null): Promise<boolean>;
    updateColumn(columnId: bigint, name: string): Promise<boolean>;
    updateTag(tagId: bigint, name: string, color: string): Promise<boolean>;
}
