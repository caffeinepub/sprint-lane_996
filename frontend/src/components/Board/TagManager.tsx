import React, { useState } from "react";
import {
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from "../../hooks/useQueries";
import type { Tag, Board } from "../../backend.d";

interface TagManagerProps {
  board: Board;
  tags: Tag[];
  onClose: () => void;
}

// Predefined color palette
const TAG_COLORS = [
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Lime", value: "#84CC16" },
  { name: "Green", value: "#22C55E" },
  { name: "Emerald", value: "#10B981" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Sky", value: "#0EA5E9" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Purple", value: "#A855F7" },
  { name: "Fuchsia", value: "#D946EF" },
  { name: "Pink", value: "#EC4899" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Gray", value: "#6B7280" },
];

export const TagManager: React.FC<TagManagerProps> = ({
  board,
  tags,
  onClose,
}) => {
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[10].value); // Default to blue

  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      await createTag.mutateAsync({
        boardId: board.id,
        name: newTagName.trim(),
        color: newTagColor,
      });
      setNewTagName("");
      setNewTagColor(TAG_COLORS[10].value);
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  const handleStartEdit = (tag: Tag) => {
    setEditingTagId(tag.id.toString());
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
  };

  const handleSaveEdit = async (tagId: bigint) => {
    if (!editTagName.trim()) return;

    try {
      await updateTag.mutateAsync({
        tagId,
        name: editTagName.trim(),
        color: editTagColor,
        boardId: board.id,
      });
      setEditingTagId(null);
    } catch (error) {
      console.error("Failed to update tag:", error);
    }
  };

  const handleDelete = async (tagId: bigint) => {
    try {
      await deleteTag.mutateAsync({
        tagId,
        boardId: board.id,
      });
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Failed to delete tag:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sprint-border">
          <div>
            <h2 className="text-lg font-semibold text-sprint-text-primary">
              Manage Tags
            </h2>
            <p className="text-sm text-sprint-text-secondary">
              {tags.length} {tags.length === 1 ? "tag" : "tags"}
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

        {/* Tag List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {tags.map((tag) => {
              const isEditing = editingTagId === tag.id.toString();
              const isConfirmingDelete = confirmDeleteId === tag.id.toString();

              if (isEditing) {
                return (
                  <div
                    key={tag.id.toString()}
                    className="p-3 bg-sprint-bg-secondary/50 rounded-lg"
                  >
                    <input
                      type="text"
                      value={editTagName}
                      onChange={(e) => setEditTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(tag.id);
                        if (e.key === "Escape") setEditingTagId(null);
                      }}
                      autoFocus
                      className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-sprint-border focus:outline-none focus:ring-2 focus:ring-sprint-accent-500/30 mb-2"
                    />
                    <div className="flex flex-wrap gap-1 mb-2">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setEditTagColor(color.value)}
                          className={`w-6 h-6 rounded-full transition-all ${
                            editTagColor === color.value
                              ? "ring-2 ring-offset-2 ring-sprint-text-primary scale-110"
                              : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(tag.id)}
                        disabled={!editTagName.trim() || updateTag.isPending}
                        className="flex-1 px-3 py-1.5 text-sm bg-sprint-accent-500 text-white rounded-lg hover:bg-sprint-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {updateTag.isPending ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingTagId(null)}
                        className="px-3 py-1.5 text-sm bg-sprint-bg-tertiary text-sprint-text-secondary rounded-lg hover:bg-sprint-bg-secondary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={tag.id.toString()}
                  className="flex items-center gap-3 p-3 bg-sprint-bg-secondary/50 rounded-lg group"
                >
                  {/* Color dot */}
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />

                  {/* Tag name */}
                  <span className="flex-1 text-sm font-medium text-sprint-text-primary">
                    {tag.name}
                  </span>

                  {/* Actions */}
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(tag.id)}
                        disabled={deleteTag.isPending}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleteTag.isPending ? "..." : "Delete"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-xs bg-sprint-bg-tertiary text-sprint-text-secondary rounded hover:bg-sprint-bg-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(tag)}
                        className="p-1.5 hover:bg-white rounded text-sprint-text-tertiary hover:text-sprint-text-primary transition-colors"
                        title="Edit tag"
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
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(tag.id.toString())}
                        className="p-1.5 hover:bg-white rounded text-sprint-text-tertiary hover:text-red-500 transition-colors"
                        title="Delete tag"
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
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {tags.length === 0 && !isCreating && (
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
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-sprint-text-tertiary">No tags yet</p>
                <p className="text-xs text-sprint-text-tertiary mt-1">
                  Create tags to categorize your cards
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Create Tag */}
        <div className="p-4 border-t border-sprint-border">
          {isCreating ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTag();
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewTagName("");
                  }
                }}
                autoFocus
                className="w-full px-3 py-2 text-sm bg-sprint-bg-secondary rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-sprint-accent-500/30"
              />

              {/* Color Palette */}
              <div>
                <p className="text-xs text-sprint-text-secondary mb-2">
                  Select color
                </p>
                <div className="flex flex-wrap gap-1">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewTagColor(color.value)}
                      className={`w-6 h-6 rounded-full transition-all ${
                        newTagColor === color.value
                          ? "ring-2 ring-offset-2 ring-sprint-text-primary scale-110"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <p className="text-xs text-sprint-text-secondary mb-2">
                  Preview
                </p>
                <span
                  className="inline-block px-2 py-0.5 text-xs font-medium rounded"
                  style={{
                    backgroundColor: `${newTagColor}20`,
                    color: newTagColor,
                  }}
                >
                  {newTagName || "Tag name"}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || createTag.isPending}
                  className="flex-1 px-3 py-2 text-sm bg-sprint-accent-500 text-white rounded-lg hover:bg-sprint-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createTag.isPending ? "Creating..." : "Create Tag"}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewTagName("");
                  }}
                  className="px-3 py-2 text-sm bg-sprint-bg-tertiary text-sprint-text-secondary rounded-lg hover:bg-sprint-bg-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Tag
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagManager;
