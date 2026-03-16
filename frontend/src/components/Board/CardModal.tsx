import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Drawer } from "vaul";
import { useUpdateCard, useDeleteCard } from "../../hooks/useQueries";
import type { Card, Tag, BoardMember, UserProfile } from "../../backend.d";
import type { Principal } from "@icp-sdk/core/principal";

// Extended CSSProperties type that allows CSS custom properties (CSS variables)
interface CSSPropertiesWithVars extends React.CSSProperties {
  [key: `--${string}`]: string | undefined;
}

// Hook to detect mobile viewport
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

interface CardModalProps {
  card: Card;
  boardId: bigint;
  tags: Tag[];
  members: BoardMember[];
  profileMap: Map<string, UserProfile>;
  onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  card,
  boardId,
  tags,
  members,
  profileMap,
  onClose,
}) => {
  const isMobile = useIsMobile();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [selectedTagIds, setSelectedTagIds] = useState<bigint[]>(card.tags);
  const [assigneeId, setAssigneeId] = useState<Principal | null>(
    card.assigneeId ?? null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const titleChanged = title !== card.title;
    const descChanged = description !== card.description;
    const tagsChanged =
      [...selectedTagIds].map(String).sort().join(",") !==
      [...card.tags].map(String).sort().join(",");
    const assigneeChanged =
      (assigneeId?.toString() ?? null) !==
      (card.assigneeId?.toString() ?? null);
    setHasChanges(
      titleChanged || descChanged || tagsChanged || assigneeChanged,
    );
  }, [title, description, selectedTagIds, assigneeId, card]);

  const handleSave = async () => {
    if (!title.trim()) return;
    try {
      await updateCard.mutateAsync({
        cardId: card.id,
        title: title.trim(),
        description: description.trim(),
        tagIds: selectedTagIds,
        assigneeId,
        boardId,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update card:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCard.mutateAsync({ cardId: card.id, boardId });
      onClose();
    } catch (error) {
      console.error("Failed to delete card:", error);
    }
  };

  const toggleTag = (tagId: bigint) => {
    setSelectedTagIds((prev) => {
      const exists = prev.some((id) => id.toString() === tagId.toString());
      if (exists) {
        return prev.filter((id) => id.toString() !== tagId.toString());
      }
      return [...prev, tagId];
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getInitials = (principalId: string): string => {
    const profile = profileMap.get(principalId);
    if (profile) return profile.username.slice(0, 2).toUpperCase();
    return principalId.slice(0, 2).toUpperCase();
  };

  const getDisplayName = (principalId: string): string => {
    const profile = profileMap.get(principalId);
    return profile?.username ?? principalId.slice(0, 8) + "...";
  };

  // Shared content render function (called as function, not JSX, to avoid remount on state change)
  const ModalContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-sprint-border">
        <div className="flex-1 min-w-0 pr-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title"
            className="w-full text-lg font-semibold text-sprint-text-primary bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-sprint-text-tertiary"
          />
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

      {/* Content */}
      <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[60vh] md:max-h-none">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-sprint-text-secondary mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a more detailed description..."
            rows={4}
            className="w-full px-3 py-2 text-sm bg-sprint-bg-secondary rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-sprint-accent-500/30 placeholder:text-sprint-text-tertiary resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-sprint-text-secondary mb-2">
            Tags
          </label>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTagIds.some(
                  (id) => id.toString() === tag.id.toString(),
                );
                return (
                  <button
                    key={tag.id.toString()}
                    onClick={() => toggleTag(tag.id)}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-lg transition-all
                      ${
                        isSelected
                          ? "ring-2 ring-offset-1"
                          : "opacity-60 hover:opacity-100"
                      }
                    `}
                    style={
                      {
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        "--tw-ring-color": isSelected ? tag.color : undefined,
                      } as CSSPropertiesWithVars
                    }
                  >
                    {tag.name}
                    {isSelected && (
                      <svg
                        className="inline-block w-3.5 h-3.5 ml-1.5 -mr-0.5"
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
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-sprint-text-tertiary">
              No tags available for this board
            </p>
          )}
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-sm font-medium text-sprint-text-secondary mb-2">
            Assignee
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAssigneeId(null)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm
                ${
                  !assigneeId
                    ? "border-sprint-accent-500 bg-sprint-accent-50 text-sprint-accent-600"
                    : "border-sprint-border text-sprint-text-secondary hover:border-sprint-accent-300"
                }
              `}
            >
              <div className="w-6 h-6 rounded-full bg-sprint-bg-tertiary flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-sprint-text-tertiary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <span>Unassigned</span>
            </button>
            {members.map((member) => {
              const isSelected =
                assigneeId?.toString() === member.userId.toString();
              return (
                <button
                  key={member.userId.toString()}
                  onClick={() => setAssigneeId(member.userId)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm
                    ${
                      isSelected
                        ? "border-sprint-accent-500 bg-sprint-accent-50 text-sprint-accent-600"
                        : "border-sprint-border text-sprint-text-secondary hover:border-sprint-accent-300"
                    }
                  `}
                >
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                      ${isSelected ? "bg-sprint-accent-500 text-white" : "bg-sprint-accent-100 text-sprint-accent-600"}
                    `}
                  >
                    {getInitials(member.userId.toString())}
                  </div>
                  <span
                    className="truncate max-w-[120px]"
                    title={member.userId.toString()}
                  >
                    {getDisplayName(member.userId.toString())}
                  </span>
                  {member.role === "owner" && (
                    <span className="text-[10px] bg-sprint-accent-100 text-sprint-accent-600 px-1.5 py-0.5 rounded">
                      Owner
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-sprint-border bg-sprint-bg-secondary/30 rounded-b-xl ">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-sprint-bg-tertiary hover:bg-sprint-bg-secondary text-sprint-text-secondary rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !hasChanges || updateCard.isPending}
            className="px-4 py-2 text-sm bg-sprint-accent-500 hover:bg-sprint-accent-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateCard.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl z-10">
          <div className="bg-white rounded-xl shadow-xl p-6 m-4 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-sprint-text-primary mb-2">
              Delete Card
            </h3>
            <p className="text-sprint-text-secondary mb-6">
              Are you sure you want to delete this card? This action cannot be
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
                onClick={handleDelete}
                disabled={deleteCard.isPending}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteCard.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Render as bottom sheet on mobile, modal on desktop
  if (isMobile) {
    return (
      <Drawer.Root open={true} onOpenChange={(open) => !open && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl outline-none max-h-[90vh] flex flex-col">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-sprint-border rounded-full" />
            </div>
            <div className="relative flex flex-col flex-1 overflow-hidden">
              {ModalContent()}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop modal - use portal to escape any transform stacking contexts
  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8 relative">
        {ModalContent()}
      </div>
    </div>,
    document.body,
  );
};

export default CardModal;
