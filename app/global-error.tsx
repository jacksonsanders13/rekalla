"use client";

import { useEffect } from "react";

/**
 * The last resort. This fires when the root layout itself fails, which means
 * it replaces the whole document: no stylesheet, no font, no tokens. Styles
 * are therefore inline, because nothing else is guaranteed to have loaded.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          padding: "24px",
          textAlign: "center",
          background: "#000000",
          color: "#ffffff",
          fontFamily:
            '"Quicksand", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>
          Rekalla could not load
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: "26rem",
            fontSize: "19px",
            lineHeight: 1.6,
            color: "#d1d1d6",
          }}
        >
          Something went wrong before the app could start. Nothing you have saved
          is affected.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: "56px",
            padding: "0 32px",
            borderRadius: "999px",
            border: 0,
            background: "#0a84ff",
            color: "#ffffff",
            fontSize: "19px",
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
