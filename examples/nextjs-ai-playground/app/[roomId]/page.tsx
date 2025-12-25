"use client";

import dynamic from "next/dynamic";

const Room = dynamic(() => import("./Room").then((mod) => mod.Room), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});
import { InfiniteCanvas } from "@/components/canvas/InfiniteCanvas";
import { AiSidebar } from "@/components/ai/AiSidebar";
import { AddComponentToolbar } from "@/components/toolbar/AddComponentToolbar";
import { ConnectionStatus } from "@/components/toolbar/ConnectionStatus";
import { useSearchParams } from "next/navigation";
import { useHistory, useMutation, useSelf } from "@liveblocks/react/suspense";
import { useEffect } from "react";
import { CanvasCameraProvider } from "@/hooks/useCanvasCameraContext";

export default function Page({ params }: { params: { roomId: string } }) {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/b6e58eb4-79e7-400a-b0ef-45b913a69f7f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'page.tsx:15', message: 'Page entry', data: { params }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'D' }) }).catch(() => { });
  // #endregion
  const roomId = useExampleRoomId(params.roomId);

  return (
    <Room roomId={roomId}>
      <CanvasCameraProvider>
        <PageContent />
      </CanvasCameraProvider>
    </Room>
  );
}

function PageContent() {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/b6e58eb4-79e7-400a-b0ef-45b913a69f7f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'page.tsx:27', message: 'PageContent entry', timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'D' }) }).catch(() => { });
  // #endregion
  const history = useHistory();
  const selectedComponentId = useSelf((me) => me.presence.selectedComponentId);

  const deleteSelected = useMutation(({ storage }) => {
    if (!selectedComponentId) return;
    storage.get("components").delete(selectedComponentId);
    const order = storage.get("componentOrder");
    const index = order.indexOf(selectedComponentId);
    if (index !== -1) {
      order.delete(index);
    }
    storage.get("whiteboardData").delete(selectedComponentId);
  }, [selectedComponentId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Check if focus is in an input or contenteditable
      const isTyping =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (isTyping) {
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          history.redo();
        } else {
          history.undo();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelected, history]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-100">
      <div className="flex-1 relative overflow-hidden">
        <ConnectionStatus />
        <InfiniteCanvas />
        <AddComponentToolbar />
      </div>
      <AiSidebar />
    </div>
  );
}

function useExampleRoomId(roomId: string) {
  const params = useSearchParams();
  const exampleId = params?.get("exampleId");
  return exampleId ? `${roomId}-${exampleId}` : roomId;
}
