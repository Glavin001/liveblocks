"use client";

import { cn } from "../../../lib/utils";
import {
  useMutation,
  useStorage,
  useSelf,
  useOthersMapped,
  useHistory,
  useCanUndo,
  useCanRedo,
} from "@liveblocks/react/suspense";
import { LiveList, LiveMap, LiveObject, shallow } from "@liveblocks/client";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Color,
  Layer,
  LayerType,
  CanvasState,
  CanvasMode,
  Side,
  XYWH,
  Point,
} from "./types";
import styles from "./index.module.css";
import {
  colorToCss,
  connectionIdToColor,
  findIntersectingLayersWithRectangle,
  penPointsToPathLayer,
  resizeBounds,
} from "./utils";
import SelectionBox from "./components/SelectionBox";
import { nanoid } from "nanoid";
import LayerComponent from "./components/LayerComponent";
import SelectionTools from "./components/SelectionTools";
import useDisableScrollBounce from "./hooks/useDisableScrollBounce";
import useDeleteLayers from "./hooks/useDeleteLayers";
import MultiplayerGuides from "./components/MultiplayerGuides";
import Path from "./components/Path";
import ToolsBar from "./components/ToolsBar";
import { WhiteboardComments } from "./WhiteboardComments";
import { WhiteboardProvider } from "./WhiteboardContext";
import { useGlobalCanvasCamera } from "../../../hooks/useCanvasCameraContext";

const MAX_LAYERS = 100;

export function WhiteboardBlock({ componentId }: { componentId: string }) {
  const whiteboardData = useStorage((root) => root.whiteboardData.get(componentId));

  // Initialize whiteboard data if it doesn't exist
  const initWhiteboard = useMutation(({ storage }) => {
    const data = storage.get("whiteboardData");
    if (!data.has(componentId)) {
      data.set(
        componentId,
        new LiveObject({
          layers: new LiveMap<string, LiveObject<Layer>>(),
          layerIds: new LiveList<string>([]),
        })
      );
    }
  }, [componentId]);

  useEffect(() => {
    initWhiteboard();
  }, [initWhiteboard]);

  if (!whiteboardData) {
    return <div className="h-full w-full items-center justify-center flex bg-white text-neutral-400 text-sm">Loading whiteboard...</div>;
  }

  return (
    <div className={styles.container}>
      <WhiteboardProvider componentId={componentId}>
        <Canvas componentId={componentId} />
      </WhiteboardProvider>
    </div>
  );
}

function Canvas({ componentId }: { componentId: string }) {
  const [showComments, setShowComments] = useState(false);
  const layerIds = useStorage((root) => root.whiteboardData.get(componentId)?.layerIds);
  const pencilDraft = useSelf((me) => me.presence.pencilDraft); 
  const { camera: globalCamera } = useGlobalCanvasCamera();
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [canvasState, setState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [camera, setCamera] = useState({ x: 0, y: 0 }); // Local camera for the whiteboard block
  
  const getPoint = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: Math.round((clientX - rect.left) / globalCamera.zoom) - camera.x,
      y: Math.round((clientY - rect.top) / globalCamera.zoom) - camera.y,
    };
  }, [globalCamera.zoom, camera.x, camera.y]);

  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 252,
    g: 142,
    b: 42,
  });
  
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useDisableScrollBounce();

  const insertPath = useMutation(
    ({ storage, self, setMyPresence }) => {
      const data = storage.get("whiteboardData").get(componentId);
      if (!data) return;
      const liveLayers = data.get("layers");
      const { pencilDraft } = self.presence;
      if (
        pencilDraft == null ||
        pencilDraft.length < 2 ||
        liveLayers.size >= MAX_LAYERS
      ) {
        setMyPresence({ pencilDraft: null });
        return;
      }

      const id = nanoid();
      liveLayers.set(
        id,
        new LiveObject(penPointsToPathLayer(pencilDraft, lastUsedColor))
      );

      const liveLayerIds = data.get("layerIds");
      liveLayerIds.push(id);
      setMyPresence({ pencilDraft: null });
      setState({ mode: CanvasMode.Pencil });
    },
    [lastUsedColor, componentId]
  );

  const startDrawing = useMutation(
    ({ setMyPresence }, point: Point, pressure: number) => {
      setMyPresence({
        pencilDraft: [[point.x, point.y, pressure]],
        penColor: lastUsedColor,
      });
    },
    [lastUsedColor]
  );

  const continueDrawing = useMutation(
    ({ self, setMyPresence }, point: Point, e: React.PointerEvent) => {
      const { pencilDraft } = self.presence;
      if (
        canvasState.mode !== CanvasMode.Pencil ||
        e.buttons !== 1 ||
        pencilDraft == null
      ) {
        return;
      }

      setMyPresence({
        pencilDraft:
          pencilDraft.length === 1 &&
          pencilDraft[0][0] === point.x &&
          pencilDraft[0][1] === point.y
            ? pencilDraft
            : [...pencilDraft, [point.x, point.y, e.pressure]],
      });
    },
    [canvasState.mode]
  );

  // Custom hook adaptations for scoped storage
  const deleteLayers = useMutation(({ storage, self, setMyPresence }) => {
    const data = storage.get("whiteboardData").get(componentId);
    if (!data) return;
    const layers = data.get("layers");
    const liveLayerIds = data.get("layerIds");
    const selection = self.presence.whiteboardSelection;
    if (selection?.componentId !== componentId) return;

    for (const id of selection.layerIds) {
      layers.delete(id);
      const index = liveLayerIds.indexOf(id);
      if (index !== -1) {
        liveLayerIds.delete(index);
      }
    }
    setMyPresence({ whiteboardSelection: null });
  }, [componentId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "Backspace": {
          deleteLayers();
          break;
        }
        case "z": {
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              history.redo();
            } else {
              history.undo();
            }
            break;
          }
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [deleteLayers, history]);

  const onLayerPointerDown = useMutation(
    ({ self, setMyPresence }, e: React.PointerEvent, layerId: string) => {
      if (
        canvasState.mode === CanvasMode.Pencil ||
        canvasState.mode === CanvasMode.Inserting
      ) {
        return;
      }

      history.pause();
      e.stopPropagation();
      const point = getPoint(e.clientX, e.clientY);
      const currentSelection = self.presence.whiteboardSelection;
      
      if (currentSelection?.componentId !== componentId || !currentSelection.layerIds.includes(layerId)) {
        setMyPresence({ 
          whiteboardSelection: { componentId, layerIds: [layerId] } 
        }, { addToHistory: true });
      }
      setState({ mode: CanvasMode.Translating, current: point });
    },
    [setState, camera, history, canvasState.mode, componentId]
  );

  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      history.pause();
      setState({
        mode: CanvasMode.Resizing,
        initialBounds,
        corner,
      });
    },
    [history]
  );

  const insertLayer = useMutation(
    (
      { storage, setMyPresence },
      layerType: LayerType.Ellipse | LayerType.Rectangle,
      position: Point
    ) => {
      const data = storage.get("whiteboardData").get(componentId);
      if (!data) return;
      const liveLayers = data.get("layers");
      if (liveLayers.size >= MAX_LAYERS) return;

      const liveLayerIds = data.get("layerIds");
      const layerId = nanoid();
      const layer = new LiveObject({
        type: layerType,
        x: position.x,
        y: position.y,
        height: 100,
        width: 100,
        fill: lastUsedColor,
      });
      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer);

      setMyPresence({ 
        whiteboardSelection: { componentId, layerIds: [layerId] } 
      }, { addToHistory: true });
      setState({ mode: CanvasMode.None });
    },
    [lastUsedColor, componentId]
  );

  const translateSelectedLayers = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Translating) return;

      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y,
      };

      const data = storage.get("whiteboardData").get(componentId);
      if (!data) return;
      const liveLayers = data.get("layers");
      const selection = self.presence.whiteboardSelection;
      if (selection?.componentId !== componentId) return;

      for (const id of selection.layerIds) {
        const layer = liveLayers.get(id);
        if (layer) {
          layer.update({
            x: layer.get("x") + offset.x,
            y: layer.get("y") + offset.y,
          });
        }
      }

      setState({ mode: CanvasMode.Translating, current: point });
    },
    [canvasState, componentId]
  );

  const resizeSelectedLayer = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Resizing) return;

      const bounds = resizeBounds(
        canvasState.initialBounds,
        canvasState.corner,
        point
      );

      const data = storage.get("whiteboardData").get(componentId);
      if (!data) return;
      const liveLayers = data.get("layers");
      const selection = self.presence.whiteboardSelection;
      if (selection?.componentId !== componentId) return;

      const layer = liveLayers.get(selection.layerIds[0]);
      if (layer) {
        layer.update(bounds);
      }
    },
    [canvasState, componentId]
  );

  const unselectLayers = useMutation(({ self, setMyPresence }) => {
    if (self.presence.whiteboardSelection?.componentId === componentId) {
      setMyPresence({ whiteboardSelection: null }, { addToHistory: true });
    }
  }, [componentId]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Ensure we don't handle events from toolbar
      if ((e.target as HTMLElement).closest(`.${styles.tools_panel_container}`)) {
        return;
      }

      const point = getPoint(e.clientX, e.clientY);
      if (canvasState.mode === CanvasMode.Inserting) return;
      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure);
        return;
      }
      setState({ origin: point, mode: CanvasMode.Pressing });
    },
    [canvasState.mode, startDrawing, getPoint]
  );

  const onPointerMove = useMutation(
    ({ setMyPresence }, e: React.PointerEvent) => {
      e.preventDefault();
      const current = getPoint(e.clientX, e.clientY);
      if (canvasState.mode === CanvasMode.Pressing) {
        // Start multi selection logic simplified
      } else if (canvasState.mode === CanvasMode.Translating) {
        translateSelectedLayers(current);
      } else if (canvasState.mode === CanvasMode.Resizing) {
        resizeSelectedLayer(current);
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawing(current, e);
      }
    },
    [canvasState, translateSelectedLayers, resizeSelectedLayer, continueDrawing, getPoint]
  );

  const onPointerUp = useMutation(
    ({}, e: React.PointerEvent) => {
      const point = getPoint(e.clientX, e.clientY);
      if (canvasState.mode === CanvasMode.Inserting) {
        insertLayer(canvasState.layerType, point);
      } else if (canvasState.mode === CanvasMode.Pencil) {
        insertPath();
      } else {
        setState({ mode: CanvasMode.None });
      }
      history.resume();
    },
    [canvasState, history, insertLayer, insertPath, getPoint]
  );

  const others = useOthersMapped((other) => other.presence.whiteboardSelection);
  const layerIdsToColorSelection = useMemo(() => {
    const res: Record<string, string> = {};
    for (const [connectionId, selection] of others) {
      if (selection?.componentId === componentId) {
        for (const id of selection.layerIds) {
          res[id] = connectionIdToColor(connectionId);
        }
      }
    }
    return res;
  }, [others, componentId]);

  if (!layerIds) return null;

  return (
    <div className={styles.canvas}>
      <button 
        onClick={() => setShowComments(!showComments)}
        className="absolute top-2 right-2 z-10 bg-white px-2 py-1 text-xs rounded border shadow hover:bg-neutral-50"
      >
        {showComments ? "Draw Shapes" : "View Comments"}
      </button>

      {showComments && <WhiteboardComments />}

      <SelectionTools
        isAnimated={
          canvasState.mode !== CanvasMode.Translating &&
          canvasState.mode !== CanvasMode.Resizing
        }
        camera={camera}
        setLastUsedColor={setLastUsedColor}
      />
      <svg
        className={styles.renderer_svg}
        ref={svgRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <g transform={`translate(${camera.x}, ${camera.y})`}>
          {layerIds.map((id) => (
            <LayerComponent
              key={id}
              id={id}
              mode={canvasState.mode}
              onLayerPointerDown={onLayerPointerDown}
              selectionColor={layerIdsToColorSelection[id]}
            />
          ))}
          <SelectionBox onResizeHandlePointerDown={onResizeHandlePointerDown} />
          {/* Drawing in progress. Still not commited to the storage. */}
          {pencilDraft != null && pencilDraft.length > 0 && (
            <Path
              points={pencilDraft}
              fill={colorToCss(lastUsedColor)}
              x={0}
              y={0}
            />
          )}
        </g>
      </svg>
      <ToolsBar
        canvasState={canvasState}
        setCanvasState={setState}
        undo={history.undo}
        redo={history.redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
}
