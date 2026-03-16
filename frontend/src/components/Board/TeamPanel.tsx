import React, { useState } from "react";
import {
  useGenerateInvite,
  useGetBoardInvites,
  useRevokeInvite,
  useRemoveMember,
  useLeaveBoard,
  useLookupUser,
  useInviteUserToBoard,
} from "../../hooks/useQueries";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import type {
  BoardMember,
  Board,
  UserProfile,
  UserSearchResult,
} from "../../backend.d";
import type { Principal } from "@icp-sdk/core/principal";

interface TeamPanelProps {
  board: Board;
  members: BoardMember[];
  profileMap: Map<string, UserProfile>;
  onClose: () => void;
  onBoardLeft: () => void;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({
  board,
  members,
  profileMap,
  onClose,
  onBoardLeft,
}) => {
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString();

  const generateInvite = useGenerateInvite();
  const { data: invites = [] } = useGetBoardInvites(board.id);
  const revokeInvite = useRevokeInvite();
  const removeMember = useRemoveMember();
  const leaveBoard = useLeaveBoard();
  const lookupUser = useLookupUser();
  const inviteUser = useInviteUserToBoard();

  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Search invite state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<
    UserSearchResult | null | undefined
  >(undefined);
  const [searchError, setSearchError] = useState("");

  const currentUserMember = members.find(
    (m) => m.userId.toString() === currentUserId,
  );
  const isOwner = currentUserMember?.role === "owner";

  const getDisplayName = (principalId: string): string => {
    const profile = profileMap.get(principalId);
    return profile?.username ?? principalId.slice(0, 12) + "...";
  };

  const getInitials = (principalId: string): string => {
    const profile = profileMap.get(principalId);
    if (profile) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    return principalId.slice(0, 2).toUpperCase();
  };

  const handleGenerateCode = async () => {
    await generateInvite.mutateAsync(board.id);
  };

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}${window.location.pathname}?invite=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRevoke = async (code: string) => {
    await revokeInvite.mutateAsync({ code, boardId: board.id });
  };

  const handleRemove = async (userId: Principal) => {
    try {
      await removeMember.mutateAsync({
        boardId: board.id,
        principalId: userId,
      });
      setConfirmRemove(null);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveBoard.mutateAsync(board.id);
      onBoardLeft();
    } catch (error) {
      console.error("Failed to leave board:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchError("");
    setSearchResult(undefined);

    try {
      const result = await lookupUser.mutateAsync(searchQuery.trim());
      if (!result) {
        setSearchError("No user found with that username or email.");
        setSearchResult(null);
      } else {
        // Check if already a member
        const alreadyMember = members.some(
          (m) => m.userId.toString() === result.userId.toString(),
        );
        if (alreadyMember) {
          setSearchError("This user is already a member of this board.");
          setSearchResult(null);
        } else {
          setSearchResult(result);
        }
      }
    } catch {
      setSearchError("Failed to search for user.");
      setSearchResult(null);
    }
  };

  const handleInviteUser = async () => {
    if (!searchResult) return;
    try {
      await inviteUser.mutateAsync({
        boardId: board.id,
        targetPrincipal: searchResult.userId,
      });
      setSearchQuery("");
      setSearchResult(undefined);
      setSearchError("");
    } catch {
      // Error handled by mutation hook
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sprint-border">
          <div>
            <h2 className="text-lg font-semibold text-sprint-text-primary">
              Team Members
            </h2>
            <p className="text-sm text-sprint-text-secondary">
              {members.length} {members.length === 1 ? "member" : "members"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-sprint-bg-secondary rounded-lg text-sprint-text-secondary transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {members.map((member) => {
              const isCurrentUser = member.userId.toString() === currentUserId;
              const memberIsOwner = member.role === "owner";
              const displayName = getDisplayName(member.userId.toString());

              return (
                <div
                  key={member.userId.toString()}
                  className="flex items-center gap-3 p-3 bg-sprint-bg-secondary/50 rounded-lg"
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      memberIsOwner
                        ? "bg-amber-100 text-amber-700"
                        : "bg-sprint-accent-100 text-sprint-accent-600"
                    }`}
                  >
                    {getInitials(member.userId.toString())}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-sprint-text-primary truncate">
                        {displayName}
                        {isCurrentUser && " (you)"}
                      </span>
                      {memberIsOwner && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-sprint-text-tertiary">
                      Joined{" "}
                      {new Date(
                        Number(member.joinedAt) / 1000000,
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  {isOwner && !memberIsOwner && (
                    <>
                      {confirmRemove === member.userId.toString() ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemove(member.userId)}
                            disabled={removeMember.isPending}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {removeMember.isPending ? "..." : "Yes"}
                          </button>
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="px-2 py-1 text-xs bg-sprint-bg-tertiary text-sprint-text-secondary rounded hover:bg-sprint-bg-secondary"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setConfirmRemove(member.userId.toString())
                          }
                          className="p-1.5 hover:bg-white rounded text-sprint-text-tertiary hover:text-red-500 transition-colors"
                          title="Remove member"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-sprint-border space-y-3">
          {/* Invite Management (owner only) */}
          {isOwner && (
            <>
              {showInvitePanel ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-sprint-text-primary">
                      Invite Members
                    </span>
                    <button
                      onClick={() => setShowInvitePanel(false)}
                      className="text-xs text-sprint-text-tertiary hover:text-sprint-text-secondary"
                    >
                      Close
                    </button>
                  </div>

                  {/* Search by username or email */}
                  <div>
                    <label className="block text-xs text-sprint-text-secondary mb-1">
                      Find by username or email
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSearchResult(undefined);
                          setSearchError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSearch();
                        }}
                        placeholder="Username or email..."
                        className="flex-1 px-3 py-2 text-sm bg-sprint-bg-secondary rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-sprint-accent-500/30 placeholder:text-sprint-text-tertiary"
                      />
                      <button
                        onClick={handleSearch}
                        disabled={!searchQuery.trim() || lookupUser.isPending}
                        className="px-3 py-2 text-sm bg-sprint-accent-500 text-white rounded-lg hover:bg-sprint-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {lookupUser.isPending ? "..." : "Search"}
                      </button>
                    </div>

                    {/* Search result */}
                    {searchResult && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-8 h-8 rounded-full bg-sprint-accent-100 flex items-center justify-center text-xs font-medium text-sprint-accent-600">
                          {searchResult.username.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="flex-1 text-sm font-medium text-sprint-text-primary">
                          {searchResult.username}
                        </span>
                        <button
                          onClick={handleInviteUser}
                          disabled={inviteUser.isPending}
                          className="px-3 py-1 text-xs bg-sprint-accent-500 text-white rounded-lg hover:bg-sprint-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {inviteUser.isPending ? "Inviting..." : "Invite"}
                        </button>
                      </div>
                    )}

                    {/* Search error */}
                    {searchError && (
                      <p className="mt-1 text-xs text-red-500">{searchError}</p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-sprint-border"></div>
                    <span className="text-xs text-sprint-text-tertiary">
                      or use invite code
                    </span>
                    <div className="flex-1 h-px bg-sprint-border"></div>
                  </div>

                  {/* Pending invite codes */}
                  {invites.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {invites.map((invite) => (
                        <div
                          key={invite.inviteCode}
                          className="flex items-center gap-2 p-2 bg-sprint-bg-secondary/50 rounded-lg"
                        >
                          <code className="flex-1 text-sm font-mono text-sprint-text-primary">
                            {invite.inviteCode}
                          </code>
                          <button
                            onClick={() => handleCopyLink(invite.inviteCode)}
                            className="p-1 hover:bg-white rounded text-sprint-text-tertiary hover:text-sprint-accent-500 transition-colors"
                            title="Copy invite link"
                          >
                            {copiedCode === invite.inviteCode ? (
                              <svg
                                className="w-4 h-4 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleRevoke(invite.inviteCode)}
                            disabled={revokeInvite.isPending}
                            className="p-1 hover:bg-white rounded text-sprint-text-tertiary hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Revoke code"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {invites.length === 0 && (
                    <p className="text-xs text-sprint-text-tertiary text-center py-1">
                      No pending invite codes
                    </p>
                  )}

                  {/* Generate new code button */}
                  <button
                    onClick={handleGenerateCode}
                    disabled={generateInvite.isPending}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-sprint-bg-secondary text-sprint-text-primary rounded-lg hover:bg-sprint-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {generateInvite.isPending
                      ? "Generating..."
                      : "Generate New Code"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowInvitePanel(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-sprint-accent-500 text-white rounded-lg hover:bg-sprint-accent-600 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Invite Members
                </button>
              )}
            </>
          )}

          {/* Leave Board Button (for non-owners) */}
          {!isOwner && (
            <>
              {showLeaveConfirm ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleLeave}
                    disabled={leaveBoard.isPending}
                    className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {leaveBoard.isPending ? "Leaving..." : "Yes, leave board"}
                  </button>
                  <button
                    onClick={() => setShowLeaveConfirm(false)}
                    className="flex-1 px-3 py-2 text-sm bg-sprint-bg-tertiary text-sprint-text-secondary rounded-lg hover:bg-sprint-bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-sprint-bg-secondary text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Leave Board
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamPanel;
