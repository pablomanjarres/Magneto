"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signOut } from "../lib/client";
import { Icon } from "./Icon";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick(): Promise<void> {
    setPending(true);
    try {
      await signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className="btn btn--sm"
      style={{ padding: "0 8px" }}
      disabled={pending}
      aria-label="Sign out"
      title="Sign out"
      onClick={() => void onClick()}
    >
      <Icon name="signOut" size={15} />
    </button>
  );
}
