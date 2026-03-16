import React, { useState, useRef, useEffect } from "react";
import type { Tag, BoardMember, UserProfile } from "../../backend.d";
import { Search, X } from "lucide-react";

export interface FilterState {
  tagIds: string[];
  assigneeIds: string[];
  searchQuery: string;
}

interface FilterBarProps {
  tags: Tag[];
  members: BoardMember[];
  profileMap: Map<string, UserProfile>;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  currentUserId?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  tags,
  members,
  profileMap,
  filters,
  onFiltersChange,
  currentUserId,
}) => {
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTagDropdown(false);
      }
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowAssigneeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTag = (tagId: string) => {
    const newTagIds = filters.tagIds.includes(tagId)
      ? filters.tagIds.filter((id) => id !== tagId)
      : [...filters.tagIds, tagId];

    onFiltersChange({ ...filters, tagIds: newTagIds });
  };

  const toggleAssignee = (assigneeId: string) => {
    const newAssigneeIds = filters.assigneeIds.includes(assigneeId)
      ? filters.assigneeIds.filter((id) => id !== assigneeId)
      : [...filters.assigneeIds, assigneeId];

    onFiltersChange({ ...filters, assigneeIds: newAssigneeIds });
  };

  const clearFilters = () => {
    onFiltersChange({ tagIds: [], assigneeIds: [], searchQuery: "" });
  };

  const clearSearch = () => {
    onFiltersChange({ ...filters, searchQuery: "" });
  };

  const hasActiveFilters =
    filters.tagIds.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.searchQuery.length > 0;
  const activeFilterCount =
    filters.tagIds.length +
    filters.assigneeIds.length +
    (filters.searchQuery ? 1 : 0);

  const getInitials = (principalId: string): string => {
    const profile = profileMap.get(principalId);
    if (profile) return profile.username.slice(0, 2).toUpperCase();
    return principalId.slice(0, 2).toUpperCase();
  };

  const getDisplayName = (principalId: string): string => {
    const profile = profileMap.get(principalId);
    return profile?.username ?? principalId.slice(0, 12) + "...";
  };

  // Quick filter for "My Cards"
  const toggleMyCards = () => {
    if (!currentUserId) return;

    if (filters.assigneeIds.includes(currentUserId)) {
      onFiltersChange({
        ...filters,
        assigneeIds: filters.assigneeIds.filter((id) => id !== currentUserId),
      });
    } else {
      onFiltersChange({
        ...filters,
        assigneeIds: [currentUserId],
      });
    }
  };

  const isMyCardsActive =
    currentUserId &&
    filters.assigneeIds.includes(currentUserId) &&
    filters.assigneeIds.length === 1;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sprint-text-tertiary" />
        <input
          type="text"
          placeholder="Search cards..."
          value={filters.searchQuery}
          onChange={(e) =>
            onFiltersChange({ ...filters, searchQuery: e.target.value })
          }
          className="pl-8 pr-8 py-1.5 text-sm bg-sprint-bg-secondary rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-sprint-accent-500/30 placeholder:text-sprint-text-tertiary w-48"
        />
        {filters.searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-sprint-text-tertiary hover:text-sprint-text-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* My Cards Quick Filter */}
      {currentUserId && (
        <button
          onClick={toggleMyCards}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            isMyCardsActive
              ? "bg-sprint-accent-500 text-white"
              : "bg-sprint-bg-secondary text-sprint-text-secondary hover:bg-sprint-bg-tertiary"
          }`}
        >
          My Cards
        </button>
      )}

      {/* Tag Filter Dropdown */}
      {tags.length > 0 && (
        <div ref={tagDropdownRef} className="relative">
          <button
            onClick={() => {
              setShowTagDropdown(!showTagDropdown);
              setShowAssigneeDropdown(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filters.tagIds.length > 0
                ? "bg-sprint-accent-100 text-sprint-accent-600"
                : "bg-sprint-bg-secondary text-sprint-text-secondary hover:bg-sprint-bg-tertiary"
            }`}
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            Tags
            {filters.tagIds.length > 0 && (
              <span className="bg-sprint-accent-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {filters.tagIds.length}
              </span>
            )}
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showTagDropdown && (
            <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-sprint-border py-1 z-30 min-w-[200px] max-h-64 overflow-y-auto">
              {tags.map((tag) => {
                const isSelected = filters.tagIds.includes(tag.id.toString());
                return (
                  <button
                    key={tag.id.toString()}
                    onClick={() => toggleTag(tag.id.toString())}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-sprint-bg-secondary transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 text-left text-sprint-text-primary">
                      {tag.name}
                    </span>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-sprint-accent-500"
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
          )}
        </div>
      )}

      {/* Assignee Filter Dropdown */}
      {members.length > 0 && (
        <div ref={assigneeDropdownRef} className="relative">
          <button
            onClick={() => {
              setShowAssigneeDropdown(!showAssigneeDropdown);
              setShowTagDropdown(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filters.assigneeIds.length > 0 && !isMyCardsActive
                ? "bg-sprint-accent-100 text-sprint-accent-600"
                : "bg-sprint-bg-secondary text-sprint-text-secondary hover:bg-sprint-bg-tertiary"
            }`}
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Assignee
            {filters.assigneeIds.length > 0 && !isMyCardsActive && (
              <span className="bg-sprint-accent-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {filters.assigneeIds.length}
              </span>
            )}
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showAssigneeDropdown && (
            <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-sprint-border py-1 z-30 min-w-[220px] max-h-64 overflow-y-auto">
              {/* Unassigned option */}
              <button
                onClick={() => toggleAssignee("unassigned")}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-sprint-bg-secondary transition-colors"
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
                <span className="flex-1 text-left text-sprint-text-primary">
                  Unassigned
                </span>
                {filters.assigneeIds.includes("unassigned") && (
                  <svg
                    className="w-4 h-4 text-sprint-accent-500"
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

              {/* Divider */}
              <div className="border-t border-sprint-border my-1" />

              {/* Members */}
              {members.map((member) => {
                const memberId = member.userId.toString();
                const isSelected = filters.assigneeIds.includes(memberId);
                const isMe = memberId === currentUserId;

                return (
                  <button
                    key={memberId}
                    onClick={() => toggleAssignee(memberId)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-sprint-bg-secondary transition-colors"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
                        member.role === "owner"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-sprint-accent-100 text-sprint-accent-600"
                      }`}
                    >
                      {getInitials(memberId)}
                    </div>
                    <span className="flex-1 text-left text-sprint-text-primary truncate">
                      {getDisplayName(memberId)}
                      {isMe && " (you)"}
                    </span>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-sprint-accent-500"
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
          )}
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-sprint-text-tertiary hover:text-sprint-text-secondary transition-colors"
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
          Clear
          {activeFilterCount > 1 && ` (${activeFilterCount})`}
        </button>
      )}
    </div>
  );
};

export default FilterBar;
