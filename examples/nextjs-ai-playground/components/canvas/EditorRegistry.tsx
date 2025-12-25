import { Editor } from "@tiptap/react";

const editorRegistry = new Map<string, Editor>();

export function registerEditor(id: string, editor: Editor) {
  editorRegistry.set(id, editor);
}

export function unregisterEditor(id: string) {
  editorRegistry.delete(id);
}

export function getEditor(id: string) {
  return editorRegistry.get(id);
}

