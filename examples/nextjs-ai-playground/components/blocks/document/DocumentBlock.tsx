"use client";

import { cn } from "../../../lib/utils";
import { useEditor, EditorContent, Editor, EditorEvents } from "@tiptap/react";
import {
  useLiveblocksExtension,
  FloatingComposer,
  FloatingThreads,
  AnchoredThreads,
  Toolbar,
  AiToolbar,
  FloatingToolbar,
} from "@liveblocks/react-tiptap";
import StarterKit from "@tiptap/starter-kit";
import { useThreads } from "@liveblocks/react/suspense";
import { useIsMobile } from "./use-is-mobile";
import VersionsDialog from "./version-history-dialog";
import { AiPlaceholder } from "./ai-placeholder";
import { AI_NAME } from "./constants";
import { useEffect } from "react";
import NotificationsPopover from "./notifications-popover";
import { registerEditor, unregisterEditor } from "../../canvas/EditorRegistry";

export function DocumentBlock({ componentId }: { componentId: string }) {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/b6e58eb4-79e7-400a-b0ef-45b913a69f7f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentBlock.tsx:15',message:'DocumentBlock entry',data:{componentId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const liveblocks = useLiveblocksExtension({
    field: `doc-${componentId}`,
    ai: {
      name: AI_NAME,
    },
  });

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "outline-none flex-1 transition-all p-4",
      },
    },
    enableContentCheck: true,
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      liveblocks,
      AiPlaceholder,
    ],
  });

  useEffect(() => {
    if (editor) {
      registerEditor(componentId, editor);
    }
    return () => {
      unregisterEditor(componentId);
    };
  }, [editor, componentId]);

  useEffect(() => {
    const onContentError = (event: EditorEvents["contentError"]) => {
      console.warn(event);
    };
    editor?.on("contentError", onContentError);
    return () => {
      editor?.off("contentError", onContentError);
    };
  }, [editor]);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center justify-between px-2 py-1 border-b bg-neutral-50 shrink-0 overflow-x-auto">
        <Toolbar editor={editor} className="flex-1 min-w-0" />
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <VersionsDialog editor={editor} />
          <NotificationsPopover />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto relative">
        <EditorContent editor={editor} className="h-full" />
        <FloatingComposer editor={editor} className="w-[300px]" />
        <FloatingToolbar editor={editor} />
        <AiToolbar editor={editor} />
      </div>

      <div className="absolute right-0 top-10 h-full pointer-events-none">
        <Threads editor={editor} />
      </div>
    </div>
  );
}

function Threads({ editor }: { editor: Editor | null }) {
  const { threads } = useThreads();
  const isMobile = useIsMobile();

  if (!threads || !editor) {
    return null;
  }

  return isMobile ? (
    <FloatingThreads threads={threads} editor={editor} />
  ) : (
    <AnchoredThreads
      threads={threads}
      editor={editor}
      className="w-[250px] mr-4 pointer-events-auto"
    />
  );
}
