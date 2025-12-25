import { useMutation } from "@liveblocks/react/suspense";

export function useResizeComponent(componentId: string) {
  const onResize = useMutation(({ storage }, bounds: { width: number; height: number; x?: number; y?: number }) => {
    const components = storage.get("components");
    const component = components.get(componentId);
    
    if (component && typeof (component as any).update === 'function') {
      component.update(bounds);
    }
  }, [componentId]);

  return onResize;
}

