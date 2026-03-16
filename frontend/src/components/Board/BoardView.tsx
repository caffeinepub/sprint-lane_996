import React, { useState, useMemo, useCallback } from "react";
import { Drawer } from "vaul";
import {
  useBoard,
  useBoardMembers,
  useBoardMemberProfiles,
  useUpdateBoard,
  useDeleteBoard,
  useCreateColumn,
  useMoveCard,
  useReorderCards,
  useReorderColumns,
  useExportBoardCSV,
} from "../../hooks/useQueries";
import { DraggableColumn } from "./DraggableColumn";
import { TeamPanel } from "./TeamPanel";
import { TagManager } from "./TagManager";
import { FilterBar, FilterState } from "./FilterBar";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  DragAndDropContext,
  useDragAndDropProvider,
} from "../../hooks/useDragAndDrop";
import type {
  BoardWithDetails,
  ColumnWithCards,
  Card as CardType,
  UserProfile,
} from "../../backend.d";

interface BoardViewProps {
  boardId: bigint;
  onBoardDeleted: () => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  boardId,
  onBoardDeleted,
}) => {
  const { data: boardData, isLoading, error } = useBoard(boardId);
  const { data: members = [] } = useBoardMembers(boardId);
  const { data: memberProfiles = [] } = useBoardMemberProfiles(boardId);
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString();
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();
  const createColumn = useCreateColumn();
  const moveCard = useMoveCard();
  const reorderCards = useReorderCards();
  const reorderColumns = useReorderColumns();
  const exportBoardCSV = useExportBoardCSV();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    tagIds: [],
    assigneeIds: [],
    searchQuery: "",
  });

  // Native drag-and-drop context
  const dragAndDropValue = useDragAndDropProvider();

  // Build a map of principal -> profile for quick lookup
  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const profile of memberProfiles) {
      map.set(profile.userId.toString(), profile);
    }
    return map;
  }, [memberProfiles]);

  // Extract data from boardData (may be undefined during loading)
  const board = boardData?.board;
  const columns = boardData?.columns ?? [];
  const tags = boardData?.tags ?? [];

  // Sort columns by position
  const sortedColumns = useMemo(
    () =>
      [...columns].sort(
        (a, b) => Number(a.column.position) - Number(b.column.position),
      ),
    [columns],
  );

  // Filter cards based on active filters
  const hasActiveFilters =
    filters.tagIds.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.searchQuery.length > 0;

  const filterCards = useCallback(
    (cards: CardType[]): CardType[] => {
      // hasActiveFilters is derived from filters, so we only need filters in deps
      const activeFilters =
        filters.tagIds.length > 0 ||
        filters.assigneeIds.length > 0 ||
        filters.searchQuery.length > 0;
      if (!activeFilters) return cards;

      const searchLower = filters.searchQuery.toLowerCase().trim();

      return cards.filter((card) => {
        // Filter by search query (match title or description)
        if (searchLower) {
          const titleMatch = card.title.toLowerCase().includes(searchLower);
          const descMatch =
            card.description?.toLowerCase().includes(searchLower) ?? false;
          if (!titleMatch && !descMatch) return false;
        }

        // Filter by tags (card must have at least one of the selected tags)
        if (filters.tagIds.length > 0) {
          const cardTagIds = card.tags.map((t) => t.toString());
          const hasMatchingTag = filters.tagIds.some((tagId) =>
            cardTagIds.includes(tagId),
          );
          if (!hasMatchingTag) return false;
        }

        // Filter by assignee
        if (filters.assigneeIds.length > 0) {
          const cardAssigneeId = card.assigneeId?.toString() ?? "unassigned";
          if (!filters.assigneeIds.includes(cardAssigneeId)) return false;
        }

        return true;
      });
    },
    [filters],
  );

  // Create filtered columns with filtered cards
  const filteredColumns = useMemo(() => {
    return sortedColumns.map((col) => ({
      ...col,
      cards: filterCards(col.cards),
    }));
  }, [sortedColumns, filterCards]);

  // Build a map of columnId -> cards for quick lookup
  const columnCardsMap = useMemo(() => {
    const map = new Map<string, CardType[]>();
    for (const col of sortedColumns) {
      const sorted = [...col.cards].sort(
        (a, b) => Number(a.position) - Number(b.position),
      );
      map.set(col.column.id.toString(), sorted);
    }
    return map;
  }, [sortedColumns]);

  // Helper to move array item
  const arrayMove = <T,>(arr: T[], from: number, to: number): T[] => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  };

  // Handle card drop (move or reorder)
  const handleCardDrop = useCallback(
    async (
      cardId: string,
      sourceColumnId: string,
      targetColumnId: string,
      position: number,
    ) => {
      if (!board) return;

      // Same column reorder
      if (sourceColumnId === targetColumnId) {
        const sourceCards = columnCardsMap.get(sourceColumnId) || [];
        const oldIndex = sourceCards.findIndex(
          (c) => c.id.toString() === cardId,
        );

        if (oldIndex !== -1) {
          // Adjust position if moving down within same column
          // When dragging down, the drop position accounts for the card being removed,
          // so we need to subtract 1 from positions after the original index
          const adjustedPosition =
            oldIndex < position ? position - 1 : position;

          // Only reorder if the final position is actually different
          if (oldIndex !== adjustedPosition) {
            const reorderedCards = arrayMove(
              sourceCards,
              oldIndex,
              adjustedPosition,
            );
            const newCardIds = reorderedCards.map((c) => c.id);

            await reorderCards.mutateAsync({
              columnId: BigInt(sourceColumnId),
              cardIds: newCardIds,
              boardId: board.id,
            });
          }
        }
      } else {
        // Cross-column move
        await moveCard.mutateAsync({
          cardId: BigInt(cardId),
          targetColumnId: BigInt(targetColumnId),
          newPosition: BigInt(position),
          boardId: board.id,
        });
      }
    },
    [board, columnCardsMap, moveCard, reorderCards],
  );

  // Handle column reorder
  const handleColumnDrop = useCallback(
    async (sourceColumnId: string, targetIndex: number) => {
      if (!board) return;

      const oldIndex = sortedColumns.findIndex(
        (col) => col.column.id.toString() === sourceColumnId,
      );

      if (oldIndex !== -1 && oldIndex !== targetIndex) {
        const reorderedCols = arrayMove(sortedColumns, oldIndex, targetIndex);
        const newColumnIds = reorderedCols.map((col) => col.column.id);

        await reorderColumns.mutateAsync({
          boardId: board.id,
          columnIds: newColumnIds,
        });
      }
    },
    [board, sortedColumns, reorderColumns],
  );

  // Early returns for loading and error states (after all hooks)
  if (isLoading) {
    return <BoardSkeleton />;
  }

  if (error || !boardData || !board) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-sprint-text-primary mb-2">
            Unable to load board
          </h3>
          <p className="text-sprint-text-secondary">
            {error?.message ||
              "The board could not be found or you don't have access."}
          </p>
        </div>
      </div>
    );
  }

  const handleStartRename = () => {
    setEditedName(board.name);
    setIsEditingName(true);
  };

  const handleSaveRename = async () => {
    if (!editedName.trim() || editedName.trim() === board.name) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateBoard.mutateAsync({
        boardId: board.id,
        name: editedName.trim(),
      });
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to rename board:", error);
    }
  };

  const handleDeleteBoard = async () => {
    try {
      await deleteBoard.mutateAsync(board.id);
      onBoardDeleted();
    } catch (error) {
      console.error("Failed to delete board:", error);
    }
  };

  const handleExportCSV = async () => {
    let url: string | null = null;
    try {
      const csvContent = await exportBoardCSV.mutateAsync(board.id);
      // Create a blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${board.name.replace(/[^a-z0-9]/gi, "_")}_export.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowBoardMenu(false);
    } catch (error) {
      console.error("Failed to export board:", error);
    } finally {
      // Always revoke the blob URL to prevent memory leak
      if (url) {
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleCreateColumn = async () => {
    if (!newColumnName.trim()) return;
    try {
      await createColumn.mutateAsync({
        boardId: board.id,
        name: newColumnName.trim(),
      });
      setNewColumnName("");
      setIsCreatingColumn(false);
    } catch (error) {
      console.error("Failed to create column:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Board Header */}
      <div className="shrink-0 bg-white border-b border-sprint-border px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEditingName ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveRename();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
                autoFocus
                className="text-lg font-semibold text-sprint-text-primary bg-sprint-bg-secondary px-2 py-1 rounded border-2 border-sprint-accent-500 focus:outline-none"
              />
            ) : (
              <h1
                className="text-lg font-semibold text-sprint-text-primary cursor-pointer hover:bg-sprint-bg-secondary px-2 py-1 rounded -mx-2 transition-colors"
                onClick={handleStartRename}
                title="Click to rename"
              >
                {board.name}
              </h1>
            )}
            <span className="text-xs text-sprint-text-tertiary bg-sprint-bg-secondary px-2 py-0.5 rounded">
              {columns.length} {columns.length === 1 ? "column" : "columns"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Bar */}
            <div className="hidden md:block">
              <FilterBar
                tags={tags}
                members={members}
                profileMap={profileMap}
                filters={filters}
                onFiltersChange={setFilters}
                currentUserId={currentUserId}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="md:hidden relative p-2 hover:bg-sprint-bg-secondary hover:text-sprint-accent-500 rounded-lg text-sprint-text-secondary transition-all duration-150 active:scale-95"
                title="Filter cards"
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
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                {(filters.tagIds.length > 0 ||
                  filters.assigneeIds.length > 0 ||
                  filters.searchQuery) && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-sprint-accent-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                    {filters.tagIds.length +
                      filters.assigneeIds.length +
                      (filters.searchQuery ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Member Avatars - clickable to open team panel */}
              <button
                onClick={() => setShowTeamPanel(true)}
                className="hidden sm:flex -space-x-2 hover:opacity-80 transition-opacity"
                title="Manage team members"
              >
                {members.slice(0, 4).map((member, i) => {
                  const profile = profileMap.get(member.userId.toString());
                  const displayName =
                    profile?.username ?? member.userId.toString().slice(0, 8);
                  const initials = profile
                    ? profile.username.slice(0, 2).toUpperCase()
                    : member.userId.toString().slice(0, 2).toUpperCase();
                  return (
                    <div
                      key={member.userId.toString()}
                      className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium ${
                        member.role === "owner"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-sprint-accent-100 text-sprint-accent-600"
                      }`}
                      title={`${displayName}${member.role === "owner" ? " (Owner)" : ""}`}
                    >
                      {initials}
                    </div>
                  );
                })}
                {members.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-sprint-bg-tertiary border-2 border-white flex items-center justify-center text-xs font-medium text-sprint-text-secondary">
                    +{members.length - 4}
                  </div>
                )}
              </button>

              {/* Team Button (mobile) */}
              <button
                onClick={() => setShowTeamPanel(true)}
                className="sm:hidden p-2 hover:bg-sprint-bg-secondary hover:text-sprint-accent-500 rounded-lg text-sprint-text-secondary transition-all duration-150 active:scale-95"
                title="Manage team"
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </button>

              {/* Tags Button */}
              <button
                onClick={() => setShowTagManager(true)}
                className="p-2 hover:bg-sprint-bg-secondary hover:text-sprint-accent-500 rounded-lg text-sprint-text-secondary transition-all duration-150 active:scale-95"
                title="Manage tags"
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
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </button>

              {/* Board Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowBoardMenu(!showBoardMenu)}
                  className="p-2 hover:bg-sprint-bg-secondary rounded-lg text-sprint-text-secondary transition-all duration-150 active:scale-95"
                  title="Board menu"
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
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>

                {/* Board Menu Dropdown */}
                {showBoardMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowBoardMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-sprint-border py-1 z-20 min-w-[160px]">
                      <button
                        onClick={handleExportCSV}
                        disabled={exportBoardCSV.isPending}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sprint-text-secondary hover:bg-sprint-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        {exportBoardCSV.isPending
                          ? "Exporting..."
                          : "Export CSV"}
                      </button>
                      <div className="border-t border-sprint-border my-1" />
                      <button
                        onClick={() => {
                          setShowBoardMenu(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
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
                        Delete Board
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Board Content - Columns */}
      <DragAndDropContext.Provider value={dragAndDropValue}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 lg:p-6">
          <div className="flex gap-4 h-full">
            {filteredColumns.map((columnWithCards, index) => (
              <DraggableColumn
                key={columnWithCards.column.id.toString()}
                columnWithCards={columnWithCards}
                boardId={board.id}
                tags={tags}
                members={members}
                profileMap={profileMap}
                index={index}
                onCardDrop={handleCardDrop}
                onColumnDrop={handleColumnDrop}
              />
            ))}

            {/* Add Column Button */}
            <div className="shrink-0 w-72">
              {isCreatingColumn ? (
                <div className="bg-white rounded-xl shadow-sm p-3 border border-sprint-border">
                  <input
                    type="text"
                    placeholder="Column name..."
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateColumn();
                      if (e.key === "Escape") {
                        setIsCreatingColumn(false);
                        setNewColumnName("");
                      }
                    }}
                    autoFocus
                    className="w-full px-3 py-2 text-sm bg-sprint-bg-secondary rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-sprint-accent-500/30"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleCreateColumn}
                      disabled={!newColumnName.trim() || createColumn.isPending}
                      className="flex-1 px-3 py-1.5 text-sm bg-sprint-accent-500 text-white rounded-lg hover:bg-sprint-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {createColumn.isPending ? "Adding..." : "Add Column"}
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingColumn(false);
                        setNewColumnName("");
                      }}
                      className="px-3 py-1.5 text-sm bg-sprint-bg-tertiary text-sprint-text-secondary rounded-lg hover:bg-sprint-bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreatingColumn(true)}
                  className="w-full h-12 bg-sprint-bg-secondary/50 hover:bg-sprint-bg-secondary border-2 border-dashed border-sprint-border hover:border-sprint-accent-400 rounded-xl flex items-center justify-center gap-2 text-sprint-text-tertiary hover:text-sprint-accent-500 transition-all duration-200 hover:scale-[1.02] active:scale-100"
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
                  <span className="text-sm font-medium">Add Column</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </DragAndDropContext.Provider>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-center text-sprint-text-primary mb-2">
              Delete Board
            </h3>
            <p className="text-center text-sprint-text-secondary mb-6">
              Are you sure you want to delete "{board.name}"? This will
              permanently delete all columns and cards. This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-sprint-bg-secondary hover:bg-sprint-bg-tertiary text-sprint-text-primary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBoard}
                disabled={deleteBoard.isPending}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteBoard.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Panel Modal */}
      {showTeamPanel && (
        <TeamPanel
          board={board}
          members={members}
          profileMap={profileMap}
          onClose={() => setShowTeamPanel(false)}
          onBoardLeft={onBoardDeleted}
        />
      )}

      {/* Tag Manager Modal */}
      {showTagManager && (
        <TagManager
          board={board}
          tags={tags}
          onClose={() => setShowTagManager(false)}
        />
      )}

      {/* Mobile Filter Drawer */}
      <Drawer.Root open={showMobileFilters} onOpenChange={setShowMobileFilters}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl outline-none max-h-[85vh] flex flex-col">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-sprint-border rounded-full" />
            </div>

            <div className="p-4 border-b border-sprint-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-sprint-text-primary">
                  Filter Cards
                </h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
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
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <FilterBar
                tags={tags}
                members={members}
                profileMap={profileMap}
                filters={filters}
                onFiltersChange={setFilters}
                currentUserId={currentUserId}
              />
            </div>

            {/* Apply button */}
            <div className="p-4 border-t border-sprint-border ">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full px-4 py-3 text-sm bg-sprint-accent-500 text-white rounded-xl hover:bg-sprint-accent-600 transition-all duration-150 font-medium active:scale-[0.98] shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};

const BoardSkeleton: React.FC = () => (
  <div className="h-full flex flex-col">
    <div className="shrink-0 bg-white border-b border-sprint-border px-4 lg:px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="h-7 w-48 bg-sprint-bg-secondary rounded animate-pulse"></div>
        <div className="h-5 w-16 bg-sprint-bg-secondary rounded animate-pulse"></div>
      </div>
    </div>
    <div className="flex-1 p-4 lg:p-6">
      <div className="flex gap-4 h-full">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="shrink-0 w-72 bg-sprint-bg-secondary/50 rounded-xl p-3"
          >
            <div className="h-5 w-24 bg-sprint-bg-tertiary rounded animate-pulse mb-3"></div>
            <div className="space-y-2">
              {[1, 2].map((j) => (
                <div
                  key={j}
                  className="h-24 bg-white rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default BoardView;
