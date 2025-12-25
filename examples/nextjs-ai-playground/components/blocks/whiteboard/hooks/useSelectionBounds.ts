import { useStorage, useSelf } from "@liveblocks/react/suspense";
import { Layer, XYWH } from "../types";
import { shallow } from "@liveblocks/client";
import { useWhiteboardContext } from "../WhiteboardContext";

function boundingBox(layers: Layer[]): XYWH | null {
  const first = layers[0];
  if (!first) {
    return null;
  }

  let left = first.x;
  let right = first.x + first.width;
  let top = first.y;
  let bottom = first.y + first.height;

  for (let i = 1; i < layers.length; i++) {
    const { x, y, width, height } = layers[i];
    if (left > x) {
      left = x;
    }
    if (right < x + width) {
      right = x + width;
    }
    if (top > y) {
      top = y;
    }
    if (bottom < y + height) {
      bottom = y + height;
    }
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

export default function useSelectionBounds() {
  const { componentId } = useWhiteboardContext();
  const selection = useSelf((me) => {
    const s = me.presence.whiteboardSelection;
    if (s?.componentId !== componentId) return [];
    return s.layerIds;
  });
  return useStorage((root) => {
    const data = root.whiteboardData.get(componentId);
    if (!data) return null;
    const selectedLayers = selection
      .map((layerId) => data.layers.get(layerId)!)
      .filter(Boolean);
    return boundingBox(selectedLayers);
  }, shallow);
}
