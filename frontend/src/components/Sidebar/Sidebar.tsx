import React, { useState } from "react";
import { useMyBoards, useCreateBoard } from "../../hooks/useQueries";
import type { Board } from "../../backend.d";

interface SidebarProps {
  selectedBoardId: bigint | null;
  onSelectBoard: (boardId: bigint) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedBoardId,
  onSelectBoard,
  onLogout,
  isOpen,
  onClose,
}) => {
  const { data: boards = [], isLoading } = useMyBoards();
  const createBoard = useCreateBoard();
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBoards = boards.filter((board) =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const boardId = await createBoard.mutateAsync(newBoardName.trim());
      setNewBoardName("");
      setIsCreating(false);
      onSelectBoard(boardId);
    } catch (error) {
      console.error("Failed to create board:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateBoard();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewBoardName("");
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-60 bg-white border-r border-sprint-border
          flex flex-col h-full
          transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-sprint-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sprint-accent-500 rounded-lg flex items-center justify-center">
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-2 h-2 bg-white rounded-sm"></div>
                <div className="w-2 h-2 bg-white rounded-sm"></div>
                <div className="w-2 h-2 bg-white rounded-sm"></div>
                <div className="w-2 h-2 bg-white rounded-sm"></div>
              </div>
            </div>
            <span className="font-semibold text-sprint-text-primary">
              SprintLane
            </span>
          </div>
          <button
            className="lg:hidden p-1 hover:bg-sprint-bg-secondary rounded"
            onClick={onClose}
          >
            <svg
              className="w-5 h-5 text-sprint-text-secondary"
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

        {/* Search */}
        <div className="px-3 py-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sprint-text-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-sprint-bg-secondary rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-sprint-accent-500/30 placeholder:text-sprint-text-tertiary"
            />
          </div>
        </div>

        {/* Boards Section */}
        <div className="flex-1 overflow-y-auto px-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-sprint-text-tertiary uppercase tracking-wider">
              Boards
            </span>
            <button
              onClick={() => setIsCreating(true)}
              className="p-1 hover:bg-sprint-bg-secondary rounded text-sprint-text-secondary hover:text-sprint-accent-500 transition-colors"
              title="Create new board"
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
            </button>
          </div>

          {/* Create board input */}
          {isCreating && (
            <div className="mb-2">
              <input
                type="text"
                placeholder="Board name..."
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!newBoardName.trim()) {
                    setIsCreating(false);
                  }
                }}
                autoFocus
                className="w-full px-3 py-2 text-sm bg-sprint-bg-secondary rounded-lg border-2 border-sprint-accent-500 focus:outline-none"
              />
              <div className="flex gap-1 mt-1">
                <button
                  onClick={handleCreateBoard}
                  disabled={!newBoardName.trim() || createBoard.isPending}
                  className="flex-1 px-2 py-1 text-xs bg-sprint-accent-500 text-white rounded hover:bg-sprint-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createBoard.isPending ? "Creating..." : "Create"}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewBoardName("");
                  }}
                  className="px-2 py-1 text-xs bg-sprint-bg-tertiary text-sprint-text-secondary rounded hover:bg-sprint-bg-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Board list */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-9 bg-sprint-bg-secondary rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : filteredBoards.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-sprint-bg-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-sprint-text-tertiary"
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
              <p className="text-sm text-sprint-text-secondary">
                {searchQuery ? "No boards found" : "No boards yet"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-2 text-sm text-sprint-accent-500 hover:text-sprint-accent-600"
                >
                  Create your first board
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredBoards.map((board) => (
                <BoardItem
                  key={board.id.toString()}
                  board={board}
                  isSelected={
                    selectedBoardId?.toString() === board.id.toString()
                  }
                  onSelect={() => {
                    onSelectBoard(board.id);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-sprint-border p-3 space-y-1">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-sprint-text-secondary hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-150"
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
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

interface BoardItemProps {
  board: Board;
  isSelected: boolean;
  onSelect: () => void;
}

const BoardItem: React.FC<BoardItemProps> = ({
  board,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150
        ${
          isSelected
            ? "bg-sprint-accent-50 text-sprint-accent-600 shadow-sm"
            : "text-sprint-text-secondary hover:bg-sprint-bg-secondary hover:translate-x-0.5"
        }
      `}
    >
      <div
        className={`
          w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-150
          ${isSelected ? "bg-sprint-accent-500 text-white shadow-sm" : "bg-sprint-bg-tertiary text-sprint-text-secondary"}
        `}
      >
        {board.name.charAt(0).toUpperCase()}
      </div>
      <span className="flex-1 truncate text-sm font-medium">{board.name}</span>
    </button>
  );
};

export default Sidebar;
