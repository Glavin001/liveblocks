"use client";

import { useStatus } from "@liveblocks/react/suspense";

export function ConnectionStatus() {
  const status = useStatus();

  return (
    <div className="fixed top-4 left-4 bg-white/80 backdrop-blur rounded-full px-3 py-1 shadow-sm border text-xs font-medium flex items-center gap-2 z-50">
      <div className={`w-2 h-2 rounded-full ${status === "connected" ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`} />
      <span className="capitalize text-neutral-600">{status}</span>
    </div>
  );
}

