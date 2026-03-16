import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
import type { Principal } from "@icp-sdk/core/principal";
import type {
  BoardWithDetails,
  Card,
  BoardInvite,
  InviteDetails,
  UserProfile,
  UserSearchResult,
} from "../backend.d";

// Helper to extract error message from unknown error
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}

// Query key factory for consistent key management
export const queryKeys = {
  // Per-user data - include principal
  myBoards: (principal: string) => ["myBoards", principal] as const,

  // Shared data - use entity ID as scope
  board: (boardId: bigint) => ["board", boardId.toString()] as const,
  boardMembers: (boardId: bigint) =>
    ["boardMembers", boardId.toString()] as const,
  boardTags: (boardId: bigint) => ["boardTags", boardId.toString()] as const,
  boardInvites: (boardId: bigint) =>
    ["boardInvites", boardId.toString()] as const,
  inviteDetails: (code: string) => ["inviteDetails", code] as const,
  userProfile: (principal: string) => ["userProfile", principal] as const,
  hasProfile: (principal: string) => ["hasProfile", principal] as const,
  memberProfiles: (boardId: bigint) =>
    ["memberProfiles", boardId.toString()] as const,
};

// Hook to get the current user's principal for query keys
export function usePrincipal(): string {
  const { identity } = useInternetIdentity();
  return identity?.getPrincipal().toString() ?? "anonymous";
}

// ==================== Query Hooks ====================

export function useMyBoards() {
  const { actor } = useActor();
  const principal = usePrincipal();

  return useQuery({
    queryKey: queryKeys.myBoards(principal),
    queryFn: async () => {
      if (!actor) return [];
      return await actor.getMyBoards();
    },
    enabled: !!actor,
    staleTime: Infinity, // Only refetch on explicit invalidation
  });
}

export function useBoard(boardId: bigint | null) {
  const { actor } = useActor();

  return useQuery({
    queryKey: boardId ? queryKeys.board(boardId) : ["board", "none"],
    queryFn: async () => {
      if (!actor || !boardId) return null;
      return await actor.getBoard(boardId);
    },
    enabled: !!actor && !!boardId,
  });
}

export function useBoardMembers(boardId: bigint | null) {
  const { actor } = useActor();

  return useQuery({
    queryKey: boardId
      ? queryKeys.boardMembers(boardId)
      : ["boardMembers", "none"],
    queryFn: async () => {
      if (!actor || !boardId) return [];
      return await actor.getBoardMembers(boardId);
    },
    enabled: !!actor && !!boardId,
  });
}

export function useBoardTags(boardId: bigint | null) {
  const { actor } = useActor();

  return useQuery({
    queryKey: boardId ? queryKeys.boardTags(boardId) : ["boardTags", "none"],
    queryFn: async () => {
      if (!actor || !boardId) return [];
      return await actor.getBoardTags(boardId);
    },
    enabled: !!actor && !!boardId,
  });
}

// ==================== Board Mutations ====================

export function useCreateBoard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const principal = usePrincipal();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.createBoard(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.myBoards(principal),
      });
      toast.success("Board created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create board: ${getErrorMessage(error)}`);
    },
  });
}

export function useUpdateBoard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const principal = usePrincipal();

  return useMutation({
    mutationFn: async ({
      boardId,
      name,
    }: {
      boardId: bigint;
      name: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.updateBoard(boardId, name);
    },
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.myBoards(principal),
      });
    },
  });
}

export function useDeleteBoard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const principal = usePrincipal();

  return useMutation({
    mutationFn: async (boardId: bigint) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.deleteBoard(boardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.myBoards(principal),
      });
      toast.success("Board deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete board: ${getErrorMessage(error)}`);
    },
  });
}

// ==================== Column Mutations ====================

export function useCreateColumn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      name,
    }: {
      boardId: bigint;
      name: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.createColumn(boardId, name);
    },
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
  });
}

export function useUpdateColumn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      columnId,
      name,
      boardId,
    }: {
      columnId: bigint;
      name: string;
      boardId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.updateColumn(columnId, name);
    },
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
  });
}

export function useReorderColumns() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      columnIds,
    }: {
      boardId: bigint;
      columnIds: bigint[];
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.reorderColumns(boardId, columnIds);
    },
    // Optimistic update - reorder columns immediately
    onMutate: async ({ boardId, columnIds }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.board(boardId) });

      const previousBoard = queryClient.getQueryData<BoardWithDetails | null>(
        queryKeys.board(boardId),
      );

      if (previousBoard) {
        const columnMap = new Map(
          previousBoard.columns.map((col) => [col.column.id.toString(), col]),
        );
        const reorderedColumns = columnIds
          .map((id, idx) => {
            const col = columnMap.get(id.toString());
            if (col) {
              return {
                ...col,
                column: { ...col.column, position: BigInt(idx) },
              };
            }
            return col;
          })
          .filter(Boolean);

        queryClient.setQueryData<BoardWithDetails>(queryKeys.board(boardId), {
          ...previousBoard,
          columns: reorderedColumns as typeof previousBoard.columns,
        });
      }

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(
          queryKeys.board(boardId),
          context.previousBoard,
        );
      }
      toast.error(`Failed to reorder columns: ${getErrorMessage(err)}`);
    },
    onSettled: (_, __, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
  });
}

export function useDeleteColumn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      columnId,
      boardId,
    }: {
      columnId: bigint;
      boardId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.deleteColumn(columnId);
    },
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      toast.success("Column deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete column: ${getErrorMessage(error)}`);
    },
  });
}

// ==================== Card Mutations ====================

export function useCreateCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      columnId,
      title,
      description,
      tagIds,
      assigneeId,
      boardId,
    }: {
      columnId: bigint;
      title: string;
      description: string;
      tagIds: bigint[];
      assigneeId: Principal | null;
      boardId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.createCard(
        columnId,
        title,
        description,
        tagIds,
        assigneeId,
      );
    },
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
    onError: (error) => {
      toast.error(`Failed to create card: ${getErrorMessage(error)}`);
    },
  });
}

export function useUpdateCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      title,
      description,
      tagIds,
      assigneeId,
      boardId,
    }: {
      cardId: bigint;
      title: string;
      description: string;
      tagIds: bigint[];
      assigneeId: Principal | null;
      boardId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.updateCard(
        cardId,
        title,
        description,
        tagIds,
        assigneeId,
      );
    },
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
  });
}

export function useMoveCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      targetColumnId,
      newPosition,
      boardId,
    }: {
      cardId: bigint;
      targetColumnId: bigint;
      newPosition: bigint;
      boardId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.moveCard(cardId, targetColumnId, newPosition);
    },
    // Optimistic update - update cache immediately before server responds
    onMutate: async ({ cardId, targetColumnId, newPosition, boardId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.board(boardId) });

      // Snapshot previous value
      const previousBoard = queryClient.getQueryData<BoardWithDetails | null>(
        queryKeys.board(boardId),
      );

      // Optimistically update the cache
      if (previousBoard) {
        const updatedColumns = previousBoard.columns.map((col) => {
          // Remove card from source column
          const filteredCards = col.cards.filter((c) => c.id !== cardId);

          // If this is the target column, add the card at the new position
          if (col.column.id === targetColumnId) {
            const movedCard = previousBoard.columns
              .flatMap((c) => c.cards)
              .find((c) => c.id === cardId);

            if (movedCard) {
              const updatedCard = {
                ...movedCard,
                columnId: targetColumnId,
                position: newPosition,
              };
              const newCards = [...filteredCards];
              newCards.splice(Number(newPosition), 0, updatedCard);
              // Update positions for all cards in this column
              return {
                ...col,
                cards: newCards.map((c, idx) => ({
                  ...c,
                  position: BigInt(idx),
                })),
              };
            }
          }

          // Update positions for remaining cards
          return {
            ...col,
            cards: filteredCards.map((c, idx) => ({
              ...c,
              position: BigInt(idx),
            })),
          };
        });

        queryClient.setQueryData<BoardWithDetails>(queryKeys.board(boardId), {
          ...previousBoard,
          columns: updatedColumns,
        });
      }

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      // Rollback on error
      if (context?.previousBoard) {
        queryClient.setQueryData(
          queryKeys.board(boardId),
          context.previousBoard,
        );
      }
      toast.error(`Failed to move card: ${getErrorMessage(err)}`);
    },
    onSettled: (_, __, { boardId }) => {
      // Refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
  });
}

export function useReorderCards() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      columnId,
      cardIds,
      boardId,
    }: {
      columnId: bigint;
      cardIds: bigint[];
      boardId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.reorderCards(columnId, cardIds);
    },
    // Optimistic update - reorder cards immediately
    onMutate: async ({ columnId, cardIds, boardId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.board(boardId) });

      // Snapshot previous value
      const previousBoard = queryClient.getQueryData<BoardWithDetails | null>(
        queryKeys.board(boardId),
      );

      // Optimistically update the cache
      if (previousBoard) {
        const updatedColumns = previousBoard.columns.map((col) => {
          if (col.column.id === columnId) {
            // Create a map of card ID to card for quick lookup
            const cardMap = new Map(col.cards.map((c) => [c.id.toString(), c]));
            // Reorder cards based on the new order
            const reorderedCards: Card[] = [];
            cardIds.forEach((id, idx) => {
              const card = cardMap.get(id.toString());
              if (card) {
                reorderedCards.push({ ...card, position: BigInt(idx) });
              }
            });
            return { ...col, cards: reorderedCards };
          }
          return col;
        });

        queryClient.setQueryData<BoardWithDetails>(queryKeys.board(boardId), {
          ...previousBoard,
          columns: updatedColumns,
        });
      }

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      // Rollback on error
      if (context?.previousBoard) {
        queryClient.setQueryData(
          queryKeys.board(boardId),
          context.previousBoard,
        );
      }
      toast.error(`Failed to reorder cards: ${getErrorMessage(err)}`);
    },
    onSettled: (_, __, { boardId }) => {
      // Refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
  });
}

export function useDeleteCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      boardId,
    }: {
      cardId: bigint;
      boardId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.deleteCard(cardId);
    },
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      toast.success("Card deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete card: ${getErrorMessage(error)}`);
    },
  });
}

// ==================== Member Mutations ====================

export function useGenerateInvite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardId: bigint) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.generateBoardInvite(boardId);
    },
    onSuccess: (_, boardId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.boardInvites(boardId),
      });
      toast.success("Invite code generated");
    },
    onError: (error) => {
      toast.error(`Failed to generate invite: ${getErrorMessage(error)}`);
    },
  });
}

export function useGetBoardInvites(boardId: bigint | null) {
  const { actor } = useActor();

  return useQuery({
    queryKey: boardId
      ? queryKeys.boardInvites(boardId)
      : ["boardInvites", "none"],
    queryFn: async () => {
      if (!actor || !boardId) return [];
      return await actor.getBoardInvites(boardId);
    },
    enabled: !!actor && !!boardId,
  });
}

export function useGetInviteDetails(code: string | null) {
  const { actor } = useActor();

  return useQuery({
    queryKey: code ? queryKeys.inviteDetails(code) : ["inviteDetails", "none"],
    queryFn: async () => {
      if (!actor || !code) return null;
      return await actor.getInviteDetails(code);
    },
    enabled: !!actor && !!code,
  });
}

export function useJoinBoardWithCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const principal = usePrincipal();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.joinBoardWithCode(code);
    },
    onSuccess: (boardId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.myBoards(principal),
      });
      if (boardId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.memberProfiles(boardId),
        });
      }
      toast.success("Joined board successfully");
    },
    onError: (error) => {
      toast.error(`Failed to join board: ${getErrorMessage(error)}`);
    },
  });
}

export function useRevokeInvite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      boardId,
    }: {
      code: string;
      boardId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.revokeInvite(code);
    },
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.boardInvites(boardId),
      });
      toast.success("Invite code revoked");
    },
    onError: (error) => {
      toast.error(`Failed to revoke invite: ${getErrorMessage(error)}`);
    },
  });
}

export function useRemoveMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      principalId,
    }: {
      boardId: bigint;
      principalId: Principal;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.removeMember(boardId, principalId);
    },
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.boardMembers(boardId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.memberProfiles(boardId),
      });
      toast.success("Member removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove member: ${getErrorMessage(error)}`);
    },
  });
}

export function useLeaveBoard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const principal = usePrincipal();

  return useMutation({
    mutationFn: async (boardId: bigint) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.leaveBoard(boardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.myBoards(principal),
      });
      toast.success("Left board successfully");
    },
    onError: (error) => {
      toast.error(`Failed to leave board: ${getErrorMessage(error)}`);
    },
  });
}

// ==================== Tag Mutations ====================

export function useCreateTag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      name,
      color,
    }: {
      boardId: bigint;
      name: string;
      color: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.createTag(boardId, name, color);
    },
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boardTags(boardId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
  });
}

export function useUpdateTag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tagId,
      name,
      color,
      boardId,
    }: {
      tagId: bigint;
      name: string;
      color: string;
      boardId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.updateTag(tagId, name, color);
    },
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boardTags(boardId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
  });
}

export function useDeleteTag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tagId,
      boardId,
    }: {
      tagId: bigint;
      boardId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.deleteTag(tagId);
    },
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boardTags(boardId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
  });
}

// ==================== User Profile ====================

export function useUserProfile() {
  const { actor } = useActor();
  const principal = usePrincipal();

  return useQuery({
    queryKey: queryKeys.userProfile(principal),
    queryFn: async () => {
      if (!actor) return null;
      return await actor.getUserProfile();
    },
    enabled: !!actor,
  });
}

export function useHasUserProfile() {
  const { actor } = useActor();
  const principal = usePrincipal();

  return useQuery({
    queryKey: queryKeys.hasProfile(principal),
    queryFn: async () => {
      if (!actor) return false;
      return await actor.hasUserProfile();
    },
    enabled: !!actor,
    staleTime: Infinity, // Only refetch on explicit invalidation
  });
}

export function useSetUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const principal = usePrincipal();

  return useMutation({
    mutationFn: async ({
      username,
      email,
    }: {
      username: string;
      email: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.setUserProfile(username, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile(principal),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.hasProfile(principal),
      });
      toast.success("Profile saved");
    },
    onError: (error) => {
      toast.error(`Failed to save profile: ${getErrorMessage(error)}`);
    },
  });
}

export function useLookupUser() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (query: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.lookupUser(query);
    },
  });
}

export function useInviteUserToBoard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      targetPrincipal,
    }: {
      boardId: bigint;
      targetPrincipal: Principal;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.inviteUserToBoard(boardId, targetPrincipal);
    },
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.boardMembers(boardId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.memberProfiles(boardId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      toast.success("User invited to board");
    },
    onError: (error) => {
      toast.error(`Failed to invite user: ${getErrorMessage(error)}`);
    },
  });
}

export function useBoardMemberProfiles(boardId: bigint | null) {
  const { actor } = useActor();

  return useQuery({
    queryKey: boardId
      ? queryKeys.memberProfiles(boardId)
      : ["memberProfiles", "none"],
    queryFn: async () => {
      if (!actor || !boardId) return [];
      return await actor.getBoardMemberProfiles(boardId);
    },
    enabled: !!actor && !!boardId,
  });
}

// ==================== Export ====================

export function useExportBoardCSV() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (boardId: bigint) => {
      if (!actor) throw new Error("Actor not initialized");
      return await actor.exportBoardCSV(boardId);
    },
  });
}
