import React, { useState, useRef } from "react";
import { CardModal } from "./CardModal";
import { useDragAndDrop } from "../../hooks/useDragAndDrop";
import type {
  Card as CardType,
  Tag,
  BoardMember,
  UserProfile,
} from "../../backend.d";

interface DraggableCardProps {
  card: CardType;
  boardId: bigint;
  tags: Tag[];
  members: BoardMember[];
  profileMap: Map<string, UserProfile>;
  columnId: string;
  index: number;
  onDropTarget: (position: number | null) => void;
  isDropTarget: boolean;
  dropPosition: number | null;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  card,
  boardId,
  tags,
  members,
  profileMap,
  columnId,
  index,
  onDropTarget,
  isDropTarget,
  dropPosition,
}) => {
  const [showModal, setShowModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { state, startDrag, endDrag, updatePosition } = useDragAndDrop();

  const cardId = card.id.toString();
  const isDragging = state.isDragging && state.dragItem?.id === cardId;

  // Get tags for this card
  const cardTags = tags.filter((tag) =>
    card.tags.some((tagId) => tagId.toString() === tag.id.toString()),
  );

  // Find assignee
  const assignee = card.assigneeId
    ? members.find((m) => m.userId.toString() === card.assigneeId?.toString())
    : null;

  const getInitials = (principalId: string): string => {
    const profile = profileMap.get(principalId);
    if (profile) return profile.username.slice(0, 2).toUpperCase();
    return principalId.slice(0, 2).toUpperCase();
  };

  const getAssigneeName = (principalId: string): string => {
    const profile = profileMap.get(principalId);
    return profile?.username ?? principalId.slice(0, 8) + "...";
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't open modal if we're dragging
    if (state.isDragging) return;
    setShowModal(true);
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Must call startDrag synchronously to set dataTransfer
    startDrag(
      {
        type: "card",
        id: cardId,
        data: card,
        sourceColumnId: columnId,
      },
      e,
    );

    // Set a custom drag image (semi-transparent version of the card)
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      e.dataTransfer.setDragImage(cardRef.current, rect.width / 2, 20);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    endDrag();
    onDropTarget(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX !== 0 || e.clientY !== 0) {
      updatePosition(e.clientX, e.clientY);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Only handle if another card is being dragged (not this card, not a column)
    if (
      !state.isDragging ||
      state.dragItem?.type !== "card" ||
      state.dragItem?.id === cardId
    ) {
      return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Calculate if we should show indicator above or below this card
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const position = e.clientY < midpoint ? index : index + 1;
      onDropTarget(position);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the card area
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!cardRef.current?.contains(relatedTarget)) {
      // Don't clear here - let the column handle it
    }
  };

  // Show drop indicator above this card
  const showDropIndicatorAbove = isDropTarget && dropPosition === index;

  // When dragging, show a placeholder (must keep onDragEnd so cleanup fires)
  if (isDragging) {
    return (
      <div
        ref={cardRef}
        onDragEnd={handleDragEnd}
        className="bg-sprint-accent-100 rounded-lg border-2 border-dashed border-sprint-accent-400 p-3 min-h-[60px] opacity-50"
      />
    );
  }

  return (
    <>
      {/* Drop indicator line above */}
      {showDropIndicatorAbove && (
        <div className="h-1 bg-sprint-accent-500 rounded-full mx-1 mb-1 transition-all" />
      )}
      <div
        ref={cardRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDrag={handleDrag}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className="bg-white rounded-lg shadow-sm border border-sprint-border/50 p-3 cursor-grab active:cursor-grabbing hover:shadow-card-hover hover:border-sprint-accent-300/50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-150 group select-none"
      >
        {/* Card Title */}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-sprint-text-primary line-clamp-2 group-hover:text-sprint-accent-600 transition-colors">
              {card.title}
            </h4>
          </div>
          {assignee && (
            <div
              className="shrink-0 w-6 h-6 rounded-full bg-sprint-accent-100 flex items-center justify-center text-[10px] font-medium text-sprint-accent-600"
              title={`Assigned to ${getAssigneeName(assignee.userId.toString())}`}
            >
              {getInitials(assignee.userId.toString())}
            </div>
          )}
        </div>

        {/* Tags */}
        {cardTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {cardTags.slice(0, 3).map((tag) => (
              <span
                key={tag.id.toString()}
                className="px-2 py-0.5 text-[10px] font-medium rounded"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                }}
              >
                {tag.name}
              </span>
            ))}
            {cardTags.length > 3 && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-sprint-bg-tertiary text-sprint-text-tertiary">
                +{cardTags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Description Preview */}
        {card.description && (
          <p className="text-xs text-sprint-text-tertiary line-clamp-2 mb-2">
            {card.description}
          </p>
        )}

        {/* Card Footer */}
        <div className="flex items-center gap-3 text-xs text-sprint-text-tertiary">
          {card.description && (
            <div className="flex items-center gap-1" title="Has description">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Card Detail Modal */}
      {showModal && (
        <CardModal
          card={card}
          boardId={boardId}
          tags={tags}
          members={members}
          profileMap={profileMap}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default DraggableCard;
