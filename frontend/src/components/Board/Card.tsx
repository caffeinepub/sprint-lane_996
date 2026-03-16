import React, { useState } from "react";
import { CardModal } from "./CardModal";
import type {
  Card as CardType,
  Tag,
  BoardMember,
  UserProfile,
} from "../../backend.d";

interface CardProps {
  card: CardType;
  boardId: bigint;
  tags: Tag[];
  members: BoardMember[];
  profileMap: Map<string, UserProfile>;
}

export const Card: React.FC<CardProps> = ({
  card,
  boardId,
  tags,
  members,
  profileMap,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Get tags for this card
  const cardTags = tags.filter((tag) =>
    card.tags.some((tagId) => tagId.toString() === tag.id.toString()),
  );

  // Find assignee
  const assignee = card.assigneeId
    ? members.find((m) => m.userId.toString() === card.assigneeId?.toString())
    : null;

  const getInitials = (principalId: string): string => {
    return principalId.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="bg-white rounded-lg shadow-sm border border-sprint-border/50 p-3 cursor-pointer hover:shadow-md hover:border-sprint-accent-300/50 transition-all group"
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
              title={`Assigned to ${assignee.userId.toString().slice(0, 8)}...`}
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

export default Card;
