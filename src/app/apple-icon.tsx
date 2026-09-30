import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-font";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const fontData = await loadGoogleFont("Lobster", "C");
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
          fontSize: 100,
          fontFamily: "Lobster",
        }}
      >
        C
      </div>
    ),
    { ...size, fonts: [{ name: "Lobster", data: fontData, style: "normal", weight: 400 }] }
  );
}
