"use client";

import { useAiChat, useDeleteAiChat, useStorage, useMutation } from "@liveblocks/react/suspense";
import { AiChat } from "@liveblocks/react-ui";
import { RegisterAiKnowledge, useRoom } from "@liveblocks/react";
import { AiTools } from "./AiTools";
import { useMemo } from "react";
import { nanoid } from "nanoid";

export function AiSidebar() {
  const roomId = useRoom().id;
  const chatId = useStorage((root) => root.chatId);
  const components = useStorage((root) => root.components);
  
  const resetChat = useMutation(({ storage }) => {
    storage.set("chatId", `chat_${roomId}_${nanoid()}`);
  }, [roomId]);
  
  const canvasState = useMemo(() => {
    const res: any[] = [];
    components.forEach((c, id) => {
      res.push({ id, type: c.type, title: c.title, x: c.x, y: c.y, width: c.width, height: c.height });
    });
    return res;
  }, [components]);

  return (
    <div className="w-96 h-full border-l bg-white flex flex-col shrink-0 relative overflow-hidden shadow-xl">
      <div className="p-4 border-b bg-neutral-50 flex items-center justify-between">
        <h2 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
          <span className="text-pink-500">✨</span> AI Copilot
        </h2>
        <button 
          onClick={() => resetChat()}
          className="text-xs text-neutral-500 hover:text-neutral-800"
        >
          New Chat
        </button>
      </div>

      <RegisterAiKnowledge
        description="The current state of the infinite canvas. Includes all components and their positions/IDs."
        value={JSON.stringify(canvasState)}
      />
      
      <AiTools />

      <AiChat
        chatId={chatId}
        copilotId={process.env.NEXT_PUBLIC_LIVEBLOCKS_COPILOT_ID || undefined}
        className="flex-1 min-h-0"
        autoFocus
      />
    </div>
  );
}
