import { ImageResponse } from "next/og";

export function renderAppIcon(sizePx: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1c4328",
          color: "#c89b3c",
          fontSize: sizePx * 0.55,
          fontWeight: 700,
          fontFamily: "Georgia, serif",
        }}
      >
        C
      </div>
    ),
    { width: sizePx, height: sizePx }
  );
}
