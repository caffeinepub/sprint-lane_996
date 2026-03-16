import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from "react";
import type { Card as CardType, Column } from "../backend.d";

// Types for drag data
export type DragItemType = "card" | "column";

export interface DragItem {
  type: DragItemType;
  id: string;
  data: CardType | Column;
  sourceColumnId?: string; // For cards, the column they came from
}

export interface DropTarget {
  type: "card" | "column" | "column-area";
  id: string;
  columnId?: string;
  position?: number;
}

export interface DragState {
  isDragging: boolean;
  dragItem: DragItem | null;
  dropTarget: DropTarget | null;
  dragPosition: { x: number; y: number };
}

export interface DragAndDropContextValue {
  state: DragState;
  startDrag: (item: DragItem, e: React.DragEvent) => void;
  updateDropTarget: (target: DropTarget | null) => void;
  updatePosition: (x: number, y: number) => void;
  endDrag: () => void;
  getDragData: () => DragItem | null;
}

const initialState: DragState = {
  isDragging: false,
  dragItem: null,
  dropTarget: null,
  dragPosition: { x: 0, y: 0 },
};

export const DragAndDropContext = createContext<DragAndDropContextValue | null>(
  null,
);

export function useDragAndDropProvider() {
  const [state, setState] = useState<DragState>(initialState);
  const dragDataRef = useRef<DragItem | null>(null);

  const startDrag = useCallback((item: DragItem, e: React.DragEvent) => {
    // Store drag data in ref for cross-component access
    dragDataRef.current = item;

    // Set drag data in the event for native drag-and-drop
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        type: item.type,
        id: item.id,
        sourceColumnId: item.sourceColumnId,
      }),
    );
    e.dataTransfer.effectAllowed = "move";

    // Create a custom drag image (optional - browser default works too)
    // We'll handle this with a portal overlay instead for better control

    setState({
      isDragging: true,
      dragItem: item,
      dropTarget: null,
      dragPosition: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const updateDropTarget = useCallback((target: DropTarget | null) => {
    setState((prev) => ({ ...prev, dropTarget: target }));
  }, []);

  const updatePosition = useCallback((x: number, y: number) => {
    setState((prev) => ({ ...prev, dragPosition: { x, y } }));
  }, []);

  const endDrag = useCallback(() => {
    dragDataRef.current = null;
    setState(initialState);
  }, []);

  const getDragData = useCallback(() => {
    return dragDataRef.current;
  }, []);

  // Fallback: listen for document-level dragend to ensure cleanup
  // even if the component-level handler doesn't fire
  useEffect(() => {
    const handleDocumentDragEnd = () => {
      if (dragDataRef.current) {
        dragDataRef.current = null;
        setState(initialState);
      }
    };
    document.addEventListener("dragend", handleDocumentDragEnd);
    return () => document.removeEventListener("dragend", handleDocumentDragEnd);
  }, []);

  return {
    state,
    startDrag,
    updateDropTarget,
    updatePosition,
    endDrag,
    getDragData,
  };
}

export function useDragAndDrop() {
  const context = useContext(DragAndDropContext);
  if (!context) {
    throw new Error("useDragAndDrop must be used within a DragAndDropProvider");
  }
  return context;
}

// Helper to parse drag data from native event
// Note: getData() only works during dragstart and drop events, not during dragover
export function parseDragData(
  e: React.DragEvent,
): { type: DragItemType; id: string; sourceColumnId?: string } | null {
  try {
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Helper to check if a drag contains valid card or column data (works during dragover)
export function hasDragData(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes("text/plain");
}

// Helper to calculate drop position based on mouse position
export function calculateDropPosition(
  e: React.DragEvent,
  containerRef: HTMLElement,
  items: { id: string; element: HTMLElement }[],
): number {
  const mouseY = e.clientY;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rect = item.element.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;

    if (mouseY < midpoint) {
      return i;
    }
  }

  return items.length;
}
