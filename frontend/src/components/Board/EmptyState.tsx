import React from "react";
import { useCreateBoard } from "../../hooks/useQueries";

interface EmptyStateProps {
  hasBoards: boolean;
  onBoardCreated: (boardId: bigint) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  hasBoards,
  onBoardCreated,
}) => {
  const createBoard = useCreateBoard();
  const [isCreating, setIsCreating] = React.useState(false);
  const [boardName, setBoardName] = React.useState("");

  const handleCreate = async () => {
    if (!boardName.trim()) return;
    try {
      const boardId = await createBoard.mutateAsync(boardName.trim());
      setBoardName("");
      setIsCreating(false);
      onBoardCreated(boardId);
    } catch (error) {
      console.error("Failed to create board:", error);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md px-4">
        {/* Icon */}
        <div className="w-20 h-20 bg-sprint-accent-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <div className="grid grid-cols-3 gap-1.5">
            <div className="w-4 h-8 bg-sprint-accent-300 rounded"></div>
            <div className="w-4 h-6 bg-sprint-accent-400 rounded"></div>
            <div className="w-4 h-10 bg-sprint-accent-500 rounded"></div>
          </div>
        </div>

        {/* Content */}
        {hasBoards ? (
          <>
            <h2 className="text-xl font-semibold text-sprint-text-primary mb-2">
              Select a board
            </h2>
            <p className="text-sprint-text-secondary mb-6">
              Choose a board from the sidebar to start managing your tasks, or
              create a new one.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-sprint-text-primary mb-2">
              Welcome to SprintLane
            </h2>
            <p className="text-sprint-text-secondary mb-6">
              Create your first board to start organizing tasks and workflows
              with a clean kanban interface.
            </p>
          </>
        )}

        {/* Create Board */}
        {isCreating ? (
          <div className="bg-white rounded-xl shadow-sm border border-sprint-border p-4 max-w-sm mx-auto">
            <input
              type="text"
              placeholder="Enter board name..."
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setBoardName("");
                }
              }}
              autoFocus
              className="w-full px-4 py-2 text-center bg-sprint-bg-secondary rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-sprint-accent-500/30 placeholder:text-sprint-text-tertiary mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setBoardName("");
                }}
                className="flex-1 px-4 py-2 bg-sprint-bg-secondary hover:bg-sprint-bg-tertiary text-sprint-text-secondary rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!boardName.trim() || createBoard.isPending}
                className="flex-1 px-4 py-2 bg-sprint-accent-500 hover:bg-sprint-accent-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createBoard.isPending ? "Creating..." : "Create Board"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-sprint-accent-500 hover:bg-sprint-accent-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg shadow-sprint-accent-500/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-lg"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create {hasBoards ? "New" : "Your First"} Board
          </button>
        )}

        {/* Features hint */}
        {!hasBoards && (
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-10 h-10 bg-sprint-bg-secondary rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-5 h-5 text-sprint-text-tertiary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
              </div>
              <span className="text-xs text-sprint-text-tertiary">
                Kanban Boards
              </span>
            </div>
            <div>
              <div className="w-10 h-10 bg-sprint-bg-secondary rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-5 h-5 text-sprint-text-tertiary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <span className="text-xs text-sprint-text-tertiary">
                Custom Tags
              </span>
            </div>
            <div>
              <div className="w-10 h-10 bg-sprint-bg-secondary rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-5 h-5 text-sprint-text-tertiary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="text-xs text-sprint-text-tertiary">
                Team Collaboration
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
