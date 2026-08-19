import type { ReactNode } from "react";
import Image from "next/image";

/**
 * The frame for the two screens a stranger can reach. No side rail and no nav:
 * there is nobody signed in to navigate as yet.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      className="stack"
      style={{
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "48px 20px",
      }}
    >
      <div className="stack" style={{ width: "100%", maxWidth: 404, gap: 20 }}>
        <div className="logo" style={{ justifyContent: "center", padding: 0 }}>
          <Image src="/brand/crescent.svg" alt="" width={30} height={30} priority />
          <span className="logo__word" style={{ fontSize: 26 }}>
            Moon Light
          </span>
        </div>
        {children}
      </div>
    </main>
  );
}
