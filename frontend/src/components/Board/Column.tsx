import React, { useState } from "react";
import {
  useUpdateColumn,
  useDeleteColumn,
  useCreateCard,
} from "../../hooks/useQueries";
import { Card } from "./Card";
import type {
  ColumnWithCards,
  Tag,
  BoardMember,
  UserProfile,
} from "../../backend.d";

interface ColumnProps {
  columnWithCards: ColumnWithCards;
  boardId: bigint;
  tags: Tag[];
  members: BoardMember[];
  profileMap: Map<string, UserProfile>;
}

export const Column: React.FC<ColumnProps> = ({
  columnWithCards,
  boardId,
  tags,
  members,
  profileMap,
}) => {
  const { column, cards } = columnWithCards;
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();
  const createCard = useCreateCard();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");

  // Sort cards by position
  const sortedCards = [...cards].sort(
    (a, b) => Number(a.position) - Number(b.position),
  );

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName.trim() === column.name) {
      setIsEditingName(false);
      setEditedName(column.name);
      return;
    }
    try {
      await updateColumn.mutateAsync({
        columnId: column.id,
        name: editedName.trim(),
        boardId,
      });
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to rename column:", error);
      setEditedName(column.name);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteColumn.mutateAsync({ columnId: column.id, boardId });
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Failed to delete column:", error);
    }
  };

  const handleCreateCard = async () => {
    if (!newCardTitle.trim()) return;
    try {
      await createCard.mutateAsync({
        columnId: column.id,
        title: newCardTitle.trim(),
        description: "",
        tagIds: [],
        assigneeId: null,
        boardId,
      });
      setNewCardTitle("");
      setIsCreatingCard(false);
    } catch (error) {
      console.error("Failed to create card:", error);
    }
  };

  return (
    <div className="shrink-0 w-72 bg-sprint-bg-secondary/50 rounded-xl flex flex-col max-h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") {
                  setIsEditingName(false);
                  setEditedName(column.name);
                }
              }}
              autoFocus
              className="text-sm font-medium text-sprint-text-primary bg-white px-2 py-1 rounded border-2 border-sprint-accent-500 focus:outline-none flex-1"
            />
          ) : (
            <h3
              className="text-sm font-medium text-sprint-text-primary truncate cursor-pointer hover:bg-white/50 px-2 py-1 -mx-2 rounded transition-colors"
              onClick={() => setIsEditingName(true)}
              title="Click to rename"
            >
              {column.name}
            </h3>
          )}
          <span className="shrink-0 text-xs text-sprint-text-tertiary bg-sprint-bg-tertiary px-1.5 py-0.5 rounded">
            {cards.length}
          </span>
        </div>

        <div className="relative flex items-center gap-1">
          <button
            onClick={() => setIsCreatingCard(true)}
            className="p-1 hover:bg-white/50 rounded text-sprint-text-secondary hover:text-sprint-accent-500 transition-colors"
            title="Add card"
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
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-white/50 rounded text-sprint-text-secondary transition-colors"
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {/* Column Menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-sprint-border py-1 z-20 min-w-[140px]">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setIsEditingName(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sprint-text-secondary hover:bg-sprint-bg-secondary transition-colors"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Rename
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
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
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {/* Create Card Form */}
        {isCreatingCard && (
          <div className="bg-white rounded-lg shadow-sm p-3 border border-sprint-accent-300">
            <textarea
              placeholder="Enter a title for this card..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateCard();
                }
                if (e.key === "Escape") {
                  setIsCreatingCard(false);
                  setNewCardTitle("");
                }
              }}
              autoFocus
              rows={2}
              className="w-full text-sm resize-none border-0 focus:outline-none focus:ring-0 placeholder:text-sprint-text-tertiary"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreateCard}
                disabled={!newCardTitle.trim() || createCard.isPending}
                className="px-3 py-1.5 text-sm bg-sprint-accent-500 text-white rounded-lg hover:bg-sprint-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createCard.isPending ? "Adding..." : "Add Card"}
              </button>
              <button
                onClick={() => {
                  setIsCreatingCard(false);
                  setNewCardTitle("");
                }}
                className="p-1.5 hover:bg-sprint-bg-secondary rounded-lg text-sprint-text-secondary transition-colors"
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
        )}

        {/* Card List */}
        {sortedCards.map((card) => (
          <Card
            key={card.id.toString()}
            card={card}
            boardId={boardId}
            tags={tags}
            members={members}
            profileMap={profileMap}
          />
        ))}

        {/* Empty State */}
        {sortedCards.length === 0 && !isCreatingCard && (
          <div className="text-center py-6">
            <p className="text-sm text-sprint-text-tertiary">No cards yet</p>
          </div>
        )}
      </div>

      {/* Add Card Button */}
      {!isCreatingCard && (
        <div className="p-2 pt-0">
          <button
            onClick={() => setIsCreatingCard(true)}
            className="w-full flex items-center justify-center gap-1 py-2 text-sm text-sprint-text-tertiary hover:text-sprint-text-secondary hover:bg-white/50 rounded-lg transition-colors"
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
            Add a card
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-sprint-text-primary mb-2">
              Delete Column
            </h3>
            <p className="text-sprint-text-secondary mb-6">
              Are you sure you want to delete "{column.name}"?
              {cards.length > 0 && (
                <span className="block mt-2 text-red-500">
                  This will also delete {cards.length}{" "}
                  {cards.length === 1 ? "card" : "cards"}.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-sprint-bg-secondary hover:bg-sprint-bg-tertiary text-sprint-text-primary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteColumn.isPending}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteColumn.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Column;
