import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useMyBoards,
  useGetInviteDetails,
  useJoinBoardWithCode,
  useHasUserProfile,
} from "./hooks/useQueries";
import { useActor } from "./hooks/useActor";
import {
  getPersistedUrlParameter,
  clearSessionParameter,
} from "./utils/urlParams";
import { LandingPage } from "./components/LandingPage";
import { LoadingScreen } from "./components/LoadingScreen";
import { Layout } from "./components/Layout";
import { BoardView } from "./components/Board/BoardView";
import { EmptyState } from "./components/Board/EmptyState";
import { ProfileSetupModal } from "./components/ProfileSetupModal";
import { ErrorBoundary } from "./components/ErrorBoundary";

const App: React.FC = () => {
  const { identity, isInitializing, login, isLoggingIn, clear } =
    useInternetIdentity();
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();

  // Clear query cache on logout
  useEffect(() => {
    if (!identity) {
      queryClient.clear();
    }
  }, [identity, queryClient]);

  // Show loading screen during authentication initialization
  if (isInitializing) {
    return <LoadingScreen />;
  }

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return <LandingPage onLogin={login} isLoggingIn={isLoggingIn} />;
  }

  // Authenticated app - show main dashboard
  // Using key={principal} forces remount on identity change to clear component state
  return (
    <AuthenticatedApp
      key={identity?.getPrincipal().toString()}
      onLogout={clear}
    />
  );
};

interface AuthenticatedAppProps {
  onLogout: () => void;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ onLogout }) => {
  const { actor } = useActor();
  const {
    data: boards = [],
    isLoading: boardsLoading,
    error: boardsError,
  } = useMyBoards();
  const {
    data: hasProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useHasUserProfile();
  const [profileComplete, setProfileComplete] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<bigint | null>(null);

  // Invite code flow
  const [inviteCode] = useState<string | null>(() =>
    getPersistedUrlParameter("invite"),
  );
  const { data: inviteDetails, isLoading: inviteLoading } =
    useGetInviteDetails(inviteCode);
  const joinBoard = useJoinBoardWithCode();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteDismissed, setInviteDismissed] = useState(false);

  // Show invite dialog when details load
  useEffect(() => {
    if (
      inviteCode &&
      inviteDetails &&
      !inviteDismissed &&
      !joinBoard.isSuccess
    ) {
      setShowInviteDialog(true);
    }
  }, [inviteCode, inviteDetails, inviteDismissed, joinBoard.isSuccess]);

  // Auto-select first board if none selected and boards exist
  useEffect(() => {
    if (!selectedBoardId && boards.length > 0) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId]);

  // Clear selection if selected board was deleted
  useEffect(() => {
    if (selectedBoardId && boards.length > 0) {
      const boardExists = boards.some(
        (b) => b.id.toString() === selectedBoardId.toString(),
      );
      if (!boardExists) {
        setSelectedBoardId(boards.length > 0 ? boards[0].id : null);
      }
    }
  }, [boards, selectedBoardId]);

  const handleBoardDeleted = () => {
    setSelectedBoardId(null);
  };

  const handleBoardCreated = (boardId: bigint) => {
    setSelectedBoardId(boardId);
  };

  const handleJoinBoard = async () => {
    if (!inviteCode) return;
    try {
      const boardId = await joinBoard.mutateAsync(inviteCode);
      setShowInviteDialog(false);
      clearSessionParameter("invite");
      setSelectedBoardId(boardId);
    } catch (error) {
      console.error("Failed to join board:", error);
    }
  };

  const handleDismissInvite = () => {
    setShowInviteDialog(false);
    setInviteDismissed(true);
    clearSessionParameter("invite");
  };

  // Loading actor or boards - show loading screen
  // Only check initial loading, NOT refetching
  // This prevents unmounting the main app during refetches and infinite loading
  if (!actor || boardsLoading || profileLoading) {
    return <LoadingScreen />;
  }

  // If there's an error, show empty state (prevents infinite loading)
  // The app will still render and allow creating a new board
  const safeBoards = boardsError ? [] : boards;

  // Show profile setup for first-time users
  const needsProfileSetup =
    !profileError && hasProfile === false && !profileComplete;

  return (
    <Layout
      selectedBoardId={selectedBoardId}
      onSelectBoard={setSelectedBoardId}
      onLogout={onLogout}
    >
      {selectedBoardId ? (
        <ErrorBoundary key={selectedBoardId.toString()}>
          <BoardView
            boardId={selectedBoardId}
            onBoardDeleted={handleBoardDeleted}
          />
        </ErrorBoundary>
      ) : (
        <EmptyState
          hasBoards={safeBoards.length > 0}
          onBoardCreated={handleBoardCreated}
        />
      )}

      {/* Profile Setup Modal (first-time users) */}
      {needsProfileSetup && (
        <ProfileSetupModal onComplete={() => setProfileComplete(true)} />
      )}

      {/* Invite Join Dialog */}
      {showInviteDialog && inviteDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-semibold text-sprint-text-primary mb-1">
              Join Board
            </h2>
            <p className="text-sm text-sprint-text-secondary mb-4">
              You've been invited to join a board.
            </p>

            <div className="bg-sprint-bg-secondary rounded-lg p-4 mb-4">
              <p className="text-base font-medium text-sprint-text-primary">
                {inviteDetails.boardName}
              </p>
              <p className="text-sm text-sprint-text-tertiary">
                {Number(inviteDetails.memberCount)}{" "}
                {Number(inviteDetails.memberCount) === 1 ? "member" : "members"}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleJoinBoard}
                disabled={joinBoard.isPending}
                className="flex-1 px-4 py-2 text-sm bg-sprint-accent-500 text-white rounded-lg hover:bg-sprint-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {joinBoard.isPending ? "Joining..." : "Join Board"}
              </button>
              <button
                onClick={handleDismissInvite}
                className="px-4 py-2 text-sm bg-sprint-bg-tertiary text-sprint-text-secondary rounded-lg hover:bg-sprint-bg-secondary transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading invite details */}
      {inviteCode && inviteLoading && !inviteDismissed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-sprint-accent-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-sprint-text-secondary">
              Loading invite details...
            </p>
          </div>
        </div>
      )}

      {/* Invalid invite code */}
      {inviteCode &&
        !inviteLoading &&
        !inviteDetails &&
        !inviteDismissed &&
        !joinBoard.isSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
              <h2 className="text-lg font-semibold text-sprint-text-primary mb-1">
                Invalid Invite
              </h2>
              <p className="text-sm text-sprint-text-secondary mb-4">
                This invite code is invalid or has already been used.
              </p>
              <button
                onClick={handleDismissInvite}
                className="w-full px-4 py-2 text-sm bg-sprint-bg-tertiary text-sprint-text-secondary rounded-lg hover:bg-sprint-bg-secondary transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
    </Layout>
  );
};

export default App;
