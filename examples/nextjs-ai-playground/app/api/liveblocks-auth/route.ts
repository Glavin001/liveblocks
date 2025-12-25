import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";
import { getAllUsers } from "../database";

/**
 * Authenticating your Liveblocks application
 * https://liveblocks.io/docs/authentication
 */

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  if (!process.env.LIVEBLOCKS_SECRET_KEY) {
    return new NextResponse("Missing LIVEBLOCKS_SECRET_KEY", { status: 403 });
  }

  // Get the userId from the request body (sent by authWithExampleId in providers.tsx)
  const { userId } = await request.json();

  // Get all users
  const users = getAllUsers();

  // Pick a consistent user from the list based on the userId
  // This ensures that multiple tabs with the same userId get the same userInfo
  const userIndex = userId
    ? Math.abs(hashCode(userId)) % users.length
    : Math.floor(Math.random() * users.length);
  const user = users[userIndex];

  // Create a session for the current user (access token auth)
  // We use the userId from the client if provided, to ensure persistence across tabs
  const session = liveblocks.prepareSession(userId || `${user.id}-${Math.random()}`, {
    userInfo: user.info,
  });

  // Use a naming pattern to allow access to rooms with a wildcard
  session.allow(`*`, session.FULL_ACCESS);

  // Authorize the user and return the result
  const { status, body } = await session.authorize();

  return new NextResponse(body, { status });
}

// Simple hash function to map userId to a consistent index
function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
