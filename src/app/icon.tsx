import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-font";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
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
          color: "#1c4328",
          fontSize: 26,
          fontFamily: "Lobster",
        }}
      >
        C
      </div>
    ),
    { ...size, fonts: [{ name: "Lobster", data: fontData, style: "normal", weight: 400 }] }
  );
}
