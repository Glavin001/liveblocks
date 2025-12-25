# Liveblocks AI Playground

This is a comprehensive "kitchen sink" example showing how to build a collaborative infinite canvas where users and an AI Copilot can work together.

## Features

- **Infinite Canvas**: Pan and zoom across an unbounded space.
- **Composable Blocks**: Add multiple instances of Whiteboards, Documents, and Video players.
- **AI Copilot**: A supervisor that can add, move, and edit components via natural language.
- **Collaborative Features**:
  - Live Cursors across the entire canvas.
  - Presence-based selection (see who is editing what).
  - Built-in Comments per block (spatial, text-anchored, and timeline).
  - Undo/Redo and Persistence to Liveblocks Storage.

## Technologies

- **Next.js** (App Router)
- **Liveblocks** (Storage, Presence, Comments, AI)
- **TipTap** (Collaborative Rich Text)
- **Yjs** (CRDT for text sync)
- **Framer Motion** (Animations)
- **Lucide React** (Icons)

## Setup

1. Create a project on [liveblocks.io](https://liveblocks.io).
2. Copy your secret key and add it to `.env.local`:
   ```bash
   LIVEBLOCKS_SECRET_KEY=sk_...
   ```
3. Create a Copilot on the Liveblocks dashboard and add its ID to `.env.local`:
   ```bash
   NEXT_PUBLIC_LIVEBLOCKS_COPILOT_ID=...
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

## Architecture

This example uses a namespaced storage pattern. The root storage contains a registry of active components, while each component's data is stored in a scoped sub-path (e.g., `whiteboardData.get(id)`). This allows for dynamic addition of collaborative features without state conflicts.

