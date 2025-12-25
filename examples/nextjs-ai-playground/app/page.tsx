"use client";

import { redirect } from "next/navigation";
import { nanoid } from "nanoid";

export default function Home() {
  const roomId = `playground-${nanoid(6)}`;
  redirect(`/${roomId}`);
}

