import { shallow } from "@liveblocks/client";
import { useOthersMapped, useUpdateMyPresence } from "@liveblocks/react/suspense";
import React, { MutableRefObject, useEffect } from "react";
import Cursor from "./Cursor";
import { useBoundingClientRectRef } from "../../hooks/useBoundingClientRectRef";
import { Camera } from "../../hooks/useCanvasCamera";

type Props = {
  // The element that's used for pointer events and scroll position
  cursorPanel: MutableRefObject<HTMLElement | null>;
  camera: Camera;
};

/**
 * This file shows you how to create a reusable live cursors component for your product.
 * The component takes a reference to another element ref `cursorPanel` and renders
 * cursors according to the location and scroll position of this panel.
 * Make sure that cursorPanel has a CSS position set, and that LiveCursors is placed inside
 */
export default function LiveCursors({ cursorPanel, camera }: Props) {
  /**
   * useMyPresence returns a function to update  the current user's presence.
   * updateMyPresence is different to the setState function returned by the useState hook from React.
   * You don't need to pass the full presence object to update it.
   * See https://liveblocks.io/docs/api-reference/liveblocks-react#useUpdateMyPresence for more information
   */
  const updateMyPresence = useUpdateMyPresence();

  /**
   * Return all the other users in the room and their presence (a cursor position in this case)
   */
  const others = useOthersMapped(
    (other) => ({
      cursor: other.presence.cursor,
      info: other.info,
    }),
    shallow
  );
  const rectRef = useBoundingClientRectRef(cursorPanel);

  useEffect(() => {
    if (!(cursorPanel?.current instanceof HTMLElement)) {
      console.warn(
        'Pass `ref` containing HTMLElement to `<LiveCursors scrollRef=""`.'
      );
      return;
    }

    // If cursorPanel, add live cursor listeners
    const updateCursor = (event: PointerEvent) => {
      if (!cursorPanel?.current) {
        return;
      }

      // Calculate position in Canvas Space
      // (Screen position) - (Container position) - (Camera pan) / (Camera zoom)
      const x = (event.clientX - rectRef.current.x - camera.x) / camera.zoom;
      const y = (event.clientY - rectRef.current.y - camera.y) / camera.zoom;

      updateMyPresence({
        cursor: {
          x: Math.round(x),
          y: Math.round(y),
        },
      });
    };

    const removeCursor = () => {
      updateMyPresence({
        cursor: null,
      });
    };

    window.addEventListener("pointermove", updateCursor);
    cursorPanel.current.addEventListener("pointerleave", removeCursor);

    // Clean up event listeners
    const oldRef = cursorPanel.current;
    return () => {
      window.removeEventListener("pointermove", updateCursor);
      if (oldRef) {
        oldRef.removeEventListener("pointerleave", removeCursor);
      }
    };
  }, [updateMyPresence, cursorPanel, camera, rectRef]);

  return (
    <>
      {
        /**
         * Iterate over other users and display a cursor based on their presence
         */
        others.map(([id, other]) => {
          if (other.cursor == null) {
            return null;
          }

          return (
            <Cursor
              variant="name"
              name={other.info.name}
              key={id}
              // connectionId is an integer that is incremented at every new connections
              // Assigning a color with a modulo makes sure that a specific user has the same colors on every clients
              color={other.info.color}
              x={other.cursor.x}
              y={other.cursor.y}
            />
          );
        })
      }
    </>
  );
}
