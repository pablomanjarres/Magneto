import type { ReactNode } from "react";

export const metadata = { title: "Moon Light", description: "Profile Manager for Magneto" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          padding: "2rem",
          background: "#0f1115",
          color: "#e8e6df",
        }}
      >
        {children}
      </body>
    </html>
  );
}
