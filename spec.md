# SprintLane

## Overview

SprintLane is a clean, Linear-inspired Kanban board application for managing tasks and workflows across projects. Built on the Internet Computer, it enables teams and individuals to organize work visually using boards, columns, and cards with real-time collaboration features.

## Authentication System

- Users must authenticate using Internet Identity before accessing the application
- Landing page displayed for unauthenticated users
- Multi-user mode - boards can be shared with other authenticated users
- All operations require authentication with anonymous principals rejected
- Board owners can invite other users to collaborate

## User Access

- Each authenticated user can create and own multiple boards
- Board owners have full control over their boards (create, edit, delete, invite members)
- Board members can view and edit cards on boards they're invited to
- Data is accessible based on board membership, not just ownership

## Core Features

### Authentication Flow

- Landing page displayed on application load with app branding and call-to-action
- Main application interface accessible only after Internet Identity authentication
- Logout functionality returns user to landing page
- All backend operations check authentication and trap if user is anonymous

### Board Management

- Create new boards with name and default columns (To Do, In Progress, Done)
- View all boards user owns or is a member of
- Delete boards (owner only, cascades to delete all columns, cards, members)
- Rename boards (owner only)
- Each board has a unique ID, name, owner, and creation timestamp

### Column Management

- Create columns within a board
- Rename columns
- Reorder columns via drag-and-drop
- Delete columns (owner only)
- Each column has position for ordering

### Card Management

- Create cards with title, description, tags, and assignee
- Edit card details (title, description, tags, assignee)
- Move cards between columns via drag-and-drop
- Reorder cards within a column
- Delete cards
- Cards support multiple tags and single assignee

### Team Collaboration

- Board owners can invite users by Principal ID
- Members can view and edit cards on shared boards
- Board owners can remove members
- Members can leave boards
- Member list visible in board settings

### Tag System

- Create tags with name and color per board
- Edit tag name and color
- Delete tags (removes from all cards)
- Assign multiple tags to cards
- Filter cards by tag

### Export

- Export board data to CSV format
- CSV includes card title, description, tags, assignee, and column

## Backend Data Storage

### Data Models

**Board:**

- ID (Nat)
- Name (Text)
- Owner ID (Principal)
- Created timestamp (Time.Time)

**Column:**

- ID (Nat)
- Board ID (Nat - reference to parent board)
- Name (Text)
- Position (Nat - for ordering)
- Created timestamp (Time.Time)

**Card:**

- ID (Nat)
- Column ID (Nat - reference to parent column)
- Board ID (Nat - reference to parent board)
- Title (Text)
- Description (Text)
- Tags ([Nat] - array of tag IDs)
- Assignee ID (?Principal - optional)
- Position (Nat - for ordering within column)
- Created timestamp (Time.Time)
- Updated timestamp (Time.Time)

**BoardMember:**

- Board ID (Nat)
- User ID (Principal)
- Role (Text - "owner" or "member")
- Joined timestamp (Time.Time)

**Tag:**

- ID (Nat)
- Board ID (Nat - reference to parent board)
- Name (Text)
- Color (Text - hex color code)

### Storage Implementation

- Uses OrderedMap for efficient data storage and retrieval
- Transient OrderedMap instance for map operations
- Persistent storage for all boards, columns, cards, members, and tags
- Auto-incrementing ID counters for each data type
- Board-based access control for all operations

## Backend Operations

### Authentication Operations

- `requireAuth(caller)`: Private function to validate authentication
- All operations check authentication before execution
- Traps if principal is anonymous

### Board Management Operations

- `createBoard(name)`: Create new board with default columns, caller becomes owner
- `getMyBoards()`: Query returning boards user owns or is member of
- `getBoard(boardId)`: Query returning board with columns and cards (must be member)
- `updateBoard(boardId, name)`: Rename board (owner only)
- `deleteBoard(boardId)`: Remove board and all data (owner only)

### Column Management Operations

- `createColumn(boardId, name)`: Add column at end of board
- `updateColumn(columnId, name)`: Rename column
- `reorderColumns(boardId, columnIds)`: Set column order
- `deleteColumn(columnId)`: Remove column

### Card Management Operations

- `createCard(columnId, title, description, tags, assigneeId)`: Create card at top of column
- `updateCard(cardId, title, description, tags, assigneeId)`: Edit card
- `moveCard(cardId, targetColumnId, position)`: Move card between columns
- `reorderCards(columnId, cardIds)`: Set card order within column
- `deleteCard(cardId)`: Remove card

### Team Collaboration Operations

- `inviteMember(boardId, principalId)`: Add user to board (owner only)
- `removeMember(boardId, principalId)`: Remove user (owner only)
- `getBoardMembers(boardId)`: List all members with roles
- `leaveBoard(boardId)`: Member leaves board

### Tag Management Operations

- `createTag(boardId, name, color)`: Create tag
- `updateTag(tagId, name, color)`: Edit tag
- `deleteTag(tagId)`: Remove tag
- `getBoardTags(boardId)`: List tags for board

### Export Operations

- `exportBoardCSV(boardId)`: Returns CSV string of board data

## User Interface

### Layout Structure

**Landing Page (Unauthenticated):**

- Navigation bar with app logo, nav links, sign in button
- Hero section with app icon and headline
- Floating decorative elements (sticky notes, task cards, etc.)
- Call-to-action button for Internet Identity login
- Light gray background with clean, modern design

**Authenticated App Layout:**

- Fixed left sidebar (240px) with:
  - App branding header
  - Search input
  - Boards list with active indicator
  - Create board button
  - Help & Settings at bottom
  - Sign out button
- Main content area for board view
- Responsive - collapsible sidebar on mobile

### Board View

- Board header with name, tabs (Board, People, Settings), filters, member avatars
- Horizontal scrolling columns (280px each)
- Column headers with name, card count, add card button
- Cards with status indicator, title, tag, assignee, metadata
- Drag-and-drop for cards and columns

### Card Component

- White background with subtle shadow
- Status circle indicator
- Title (bold, 14px)
- Tag label (muted, 12px)
- Bottom row: metadata icons, assignee initials

### Card Modal

- Large title input
- Description textarea
- Tag selector (multi-select pills)
- Assignee dropdown (board members)
- Delete button with confirmation
- Close button / click outside to close

## Design System

### Colors

| Token          | Value     | Usage                |
| -------------- | --------- | -------------------- |
| Background     | `#F8F9FA` | Page background      |
| Surface        | `#FFFFFF` | Cards, sidebar       |
| Border         | `#E5E7EB` | Subtle borders       |
| Text Primary   | `#1A1A1A` | Titles, headings     |
| Text Secondary | `#6B7280` | Labels, muted text   |
| Accent         | `#3B82F6` | Active states, links |
| Accent Light   | `#EFF6FF` | Active bg            |

### Typography

- Board title: 18px semibold
- Card title: 14px medium
- Card tag: 12px regular, text-secondary
- Column header: 14px medium + count badge

### Spacing

- Sidebar: 240px width
- Column: 280px width
- Column gap: 16px
- Card padding: 12px
- Card gap: 8px

### Components

- Cards: `rounded-lg`, `shadow-sm`, white bg
- Buttons: `rounded-md`, blue accent for primary
- Inputs: `rounded-md`, border-gray-300
- Avatars: 24px circle with initials

## Mobile Responsive Design

- Full responsive layout using Tailwind breakpoints
- Horizontal scroll for columns on mobile
- Touch-friendly drag-and-drop (dnd-kit supports touch)
- Hamburger menu for sidebar
- Cards stack vertically on mobile
- Bottom sheet for card details (optional)

## State Management

- React hooks (useState) for local component state
- React Query (TanStack Query) for server state:
  - Automatic caching and refetching
  - Loading and error states
  - Mutation handling with invalidation
  - Query keys include principal for per-user data
  - Shared data queries use entity ID as scope
- useInternetIdentity for authentication state
- Cache cleared on logout to handle shared data

## Data Flow

- Frontend makes async calls to backend canister
- React Query manages loading, error, and success states
- Mutations trigger invalidateQueries for affected data
- Time conversions between JavaScript and Motoko timestamps
- BigInt handling for Motoko Nat types
- Optimistic UI updates for drag-and-drop operations
