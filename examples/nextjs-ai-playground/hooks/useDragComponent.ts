import { useMutation } from "@liveblocks/react/suspense";

export function useDragComponent(componentId: string) {
  const onDrag = useMutation(({ storage }, delta: { x: number; y: number }) => {
    const components = storage.get("components");
    const component = components.get(componentId);

    if (component && typeof (component as any).get === 'function') {
      const currentX = (component as any).get("x");
      const currentY = (component as any).get("y");

      (component as any).update({
        x: currentX + delta.x,
        y: currentY + delta.y,
      });
    }
  }, [componentId]);

  return onDrag;
}

