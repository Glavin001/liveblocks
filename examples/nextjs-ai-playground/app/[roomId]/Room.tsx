"use client";

import { ReactNode } from "react";
import { RoomProvider } from "@liveblocks/react/suspense";
import { LiveList, LiveMap } from "@liveblocks/client";
import Loading from "../loading";
import { ClientSideSuspense } from "@liveblocks/react";
import { nanoid } from "nanoid";

export function Room({ children, roomId }: { children: ReactNode; roomId: string }) {
  // ... (agent log hidden)
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        selectedComponentId: null,
        whiteboardSelection: null,
        pencilDraft: null,
        penColor: null,
      }}
      initialStorage={{
        chatId: `chat_${roomId}`, // Simple ID scoped to the room
        components: new LiveMap(),
        componentOrder: new LiveList([]),
        whiteboardData: new LiveMap(),
      }}
    >
      <ClientSideSuspense fallback={<Loading />}>
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
}

