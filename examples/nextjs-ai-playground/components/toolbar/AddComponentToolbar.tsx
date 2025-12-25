"use client";

import { useMutation } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { nanoid } from "nanoid";
import { Square, Type, Video, Plus } from "lucide-react";

export function AddComponentToolbar() {
  const addComponent = useMutation(({ storage }, type: "whiteboard" | "document" | "video") => {
    const id = nanoid();
    const component = new LiveObject({
      id,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      x: 100 + Math.random() * 50,
      y: 100 + Math.random() * 50,
      width: type === "video" ? 480 : 400,
      height: type === "video" ? 320 : 400,
      videoUrl: type === "video" ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" : undefined,
    });
    storage.get("components").set(id, component);
    storage.get("componentOrder").push(id);
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border p-2 flex gap-2 items-center z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="px-3 py-1 text-xs font-bold text-neutral-400 uppercase tracking-wider border-r mr-1">
        Add Block
      </div>
      <ToolbarButton 
        onClick={() => addComponent("whiteboard")} 
        icon={<Square size={18} />} 
        label="Whiteboard" 
      />
      <ToolbarButton 
        onClick={() => addComponent("document")} 
        icon={<Type size={18} />} 
        label="Document" 
      />
      <ToolbarButton 
        onClick={() => addComponent("video")} 
        icon={<Video size={18} />} 
        label="Video" 
      />
    </div>
  );
}

function ToolbarButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-700"
      title={label}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

