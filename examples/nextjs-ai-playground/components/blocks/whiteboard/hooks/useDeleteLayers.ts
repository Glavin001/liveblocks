import { useMutation } from "@liveblocks/react/suspense";
import { useWhiteboardContext } from "../WhiteboardContext";

/**
 * Delete all the selected layers.
 */
export default function useDeleteLayers() {
  const { componentId } = useWhiteboardContext();
  return useMutation(
    ({ storage, self, setMyPresence }) => {
      const data = storage.get("whiteboardData").get(componentId);
      if (!data) return;
      const liveLayers = data.get("layers");
      const liveLayerIds = data.get("layerIds");
      const selection = self.presence.whiteboardSelection;
      if (selection?.componentId !== componentId) return;

      for (const id of selection.layerIds) {
        // Delete the layer from the layers LiveMap
        liveLayers.delete(id);
        // Find the layer index in the z-index list and remove it
        const index = liveLayerIds.indexOf(id);
        if (index !== -1) {
          liveLayerIds.delete(index);
        }
      }
      setMyPresence({ whiteboardSelection: null }, { addToHistory: true });
    },
    [componentId]
  );
}
