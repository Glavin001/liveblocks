import { defineAiTool, LiveObject } from "@liveblocks/client";
import { RegisterAiTool, useMutation, useCreateThread } from "@liveblocks/react";
import { nanoid } from "nanoid";
import { getEditor } from "../canvas/EditorRegistry";

export function AiTools() {
  const createThread = useCreateThread();

  const addComponent = useMutation(({ storage }, { type, title, videoUrl }: any) => {
    const id = nanoid();
    const component = new LiveObject({
      id,
      type,
      title,
      x: Math.random() * 400,
      y: Math.random() * 400,
      width: type === "video" ? 480 : 400,
      height: type === "video" ? 320 : 400,
      videoUrl,
    });
    storage.get("components").set(id, component);
    storage.get("componentOrder").push(id);
  }, []);

  const removeComponent = useMutation(({ storage }, { id }: any) => {
    storage.get("components").delete(id);
    const order = storage.get("componentOrder");
    const index = order.indexOf(id);
    if (index !== -1) {
      order.delete(index);
    }
    storage.get("whiteboardData").delete(id);
  }, []);

  const moveComponent = useMutation(({ storage }, { id, x, y, width, height }: any) => {
    const component = storage.get("components").get(id);
    if (component) {
      if (x !== undefined) component.set("x", x);
      if (y !== undefined) component.set("y", y);
      if (width !== undefined) component.set("width", width);
      if (height !== undefined) component.set("height", height);
    }
  }, []);

  const addWhiteboardShape = useMutation(({ storage }, { componentId, shapeType, x, y, width, height, color }: any) => {
    const data = storage.get("whiteboardData").get(componentId);
    if (!data) return;
    const id = nanoid();
    const shape = {
      type: shapeType === "rectangle" ? 0 : 1, 
      x,
      y,
      width,
      height,
      fill: color ? hexToRgb(color) : { r: 252, g: 142, b: 42 },
    };
    data.get("layers").set(id, shape as any);
    data.get("layerIds").push(id);
  }, []);

  return (
    <>
      <RegisterAiTool
        name="add_component"
        tool={defineAiTool()({
          description: "Add a new whiteboard, document, or video to the canvas. For video, you can provide a URL.",
          parameters: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["whiteboard", "document", "video"] },
              title: { type: "string" },
              videoUrl: { type: "string" },
            },
            required: ["type", "title"],
          },
          execute: async (args) => {
            addComponent(args);
            return { data: { success: true } };
          },
        })}
      />
      <RegisterAiTool
        name="remove_component"
        tool={defineAiTool()({
          description: "Remove a component from the canvas by its ID.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string" },
            },
            required: ["id"],
          },
          execute: async (args) => {
            removeComponent(args);
            return { data: { success: true } };
          },
        })}
      />
      <RegisterAiTool
        name="move_component"
        tool={defineAiTool()({
          description: "Move or resize a component on the canvas.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string" },
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
            },
            required: ["id"],
          },
          execute: async (args) => {
            moveComponent(args);
            return { data: { success: true } };
          },
        })}
      />
      <RegisterAiTool
        name="whiteboard_add_shape"
        tool={defineAiTool()({
          description: "Add a shape to a specific whiteboard component.",
          parameters: {
            type: "object",
            properties: {
              componentId: { type: "string" },
              shapeType: { type: "string", enum: ["rectangle", "ellipse"] },
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
              color: { type: "string", description: "Hex color code" },
            },
            required: ["componentId", "shapeType", "x", "y", "width", "height"],
          },
          execute: async (args) => {
            addWhiteboardShape(args);
            return { data: { success: true } };
          },
        })}
      />
      <RegisterAiTool
        name="document_set_content"
        tool={defineAiTool()({
          description: "Set or append text content to a specific document component.",
          parameters: {
            type: "object",
            properties: {
              componentId: { type: "string" },
              content: { type: "string", description: "Text or HTML content" },
              mode: { type: "string", enum: ["replace", "append"] },
            },
            required: ["componentId", "content", "mode"],
          },
          execute: async ({ componentId, content, mode }) => {
            const editor = getEditor(componentId);
            if (!editor) {
              return { error: "Document not found or not currently visible." };
            }
            if (mode === "replace") {
              editor.commands.setContent(content);
            } else {
              editor.commands.insertContent(content);
            }
            return { data: { success: true } };
          },
        })}
      />
      <RegisterAiTool
        name="add_comment"
        tool={defineAiTool()({
          description: "Add a comment to any component.",
          parameters: {
            type: "object",
            properties: {
              componentId: { type: "string" },
              body: { type: "string" },
              x: { type: "number" },
              y: { type: "number" },
              time: { type: "number" },
            },
            required: ["componentId", "body"],
          },
          execute: async ({ componentId, body, x, y, time }) => {
            createThread({
              body,
              metadata: {
                componentId,
                x,
                y,
                time,
              },
            });
            return { data: { success: true } };
          },
        })}
      />
    </>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}
