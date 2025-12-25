"use client";

import { LiveblocksProvider } from "@liveblocks/react/suspense";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/b6e58eb4-79e7-400a-b0ef-45b913a69f7f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'providers.tsx:10', message: 'Providers entry', timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'D' }) }).catch(() => { });
  // #endregion
  return (
    <LiveblocksProvider
      authEndpoint={authWithExampleId("/api/liveblocks-auth")}
      resolveUsers={async ({ userIds }) => {
        const searchParams = new URLSearchParams(
          userIds.map((userId) => ["userIds", userId])
        );
        const response = await fetch(`/api/users?${searchParams}`);

        if (!response.ok) {
          throw new Error("Problem resolving users");
        }

        const users = await response.json();
        return users;
      }}
      resolveMentionSuggestions={async ({ text }) => {
        const response = await fetch(
          `/api/users/search?text=${encodeURIComponent(text)}`
        );

        if (!response.ok) {
          throw new Error("Problem resolving mention suggestions");
        }

        const userIds = await response.json();
        return userIds;
      }}
    >
      {children}
    </LiveblocksProvider>
  );
}

/**
 * This function is used to ensure that the same user is used across tabs in the same browser.
 * It stores a random user ID in localStorage and sends it to the auth endpoint.
 */
function authWithExampleId(endpoint: string) {
  return async (room?: string) => {
    let userId = typeof window !== "undefined" ? localStorage.getItem("liveblocks-example-id") : null;
    if (!userId) {
      userId = Math.random().toString(36).substring(2);
      if (typeof window !== "undefined") {
        localStorage.setItem("liveblocks-example-id", userId);
      }
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room, userId }),
    });
    return await response.json();
  };
}

