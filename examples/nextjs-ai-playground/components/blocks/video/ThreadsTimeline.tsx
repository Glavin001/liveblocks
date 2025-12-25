"use client";

import { useThreads, useUser } from "@liveblocks/react/suspense";
import { ClientSideSuspense } from "@liveblocks/react";
import { ErrorBoundary } from "react-error-boundary";
import styles from "./ThreadsTimeline.module.css";
import { ThreadData } from "@liveblocks/core";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Comment } from "@liveblocks/react-ui/primitives";
import {
  resetAllHighlights,
  useHighlightPinListener,
  useHighlightThread,
} from "./utils";
import { formatTime } from "./Duration";
import { useState } from "react";

export function ThreadsTimeline({ componentId }: { componentId: string }) {
  return (
    <ErrorBoundary fallback={<div>Error</div>}>
      <ClientSideSuspense fallback={null}>
        <PinnedThreads componentId={componentId} />
      </ClientSideSuspense>
    </ErrorBoundary>
  );
}

function PinnedThreads({ componentId }: { componentId: string }) {
  const { threads } = useThreads({
    query: {
      metadata: {
        componentId,
      },
    },
  });

  return (
    <div className={styles.pinnedThreads}>
      {threads.map((thread) => (
        <PinnedThread key={thread.id} thread={thread} />
      ))}
    </div>
  );
}

function PinnedThread({ thread }: { thread: ThreadData }) {
  const { user } = useUser(thread.comments?.[0].userId || "");
  const highlightThread = useHighlightThread(thread.id);
  const [highlightedPin, setHighlightedPin] = useState(false);

  // On highlight event, highlight this pin
  useHighlightPinListener((threadId) => {
    if (thread.id !== threadId) {
      setHighlightedPin(false);
      return;
    }

    setHighlightedPin(false);
    setTimeout(() => setHighlightedPin(true));
  });

  // Not intended to be on the timeline, or all comments deleted
  if (!thread.metadata.time || thread.metadata.time === -1 || !thread.comments.length) {
    return null;
  }

  return (
    <div
      className={styles.pinnedThread}
      onClick={highlightThread}
      onPointerEnter={highlightThread}
      onPointerLeave={resetAllHighlights}
      style={{ left: `${thread.metadata.timePercentage}%` }}
      data-highlight={highlightedPin || undefined}
    >
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div className={styles.avatarPin}>
              <img src={user?.avatar} alt={user?.name} />
            </div>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className={styles.tooltip} side="top">
              <div className={styles.tooltipHeader}>
                <img src={user?.avatar} alt="" />
                {user?.name}
              </div>
              <div className={styles.tooltipBody}>
                <span>{formatTime(thread.metadata.time as number) + " "}</span>
                <Comment.Body body={thread.comments[0].body} />
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  );
}
