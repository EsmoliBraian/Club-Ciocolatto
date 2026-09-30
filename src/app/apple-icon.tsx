import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Phosphor Icons "Crown" (fill weight), inlined as raw SVG — simpler and more
// reliable inside next/og's Satori renderer than importing the React
// component, and this icon needs no font loading at all.
const CROWN_PATH =
  "M248,80a28,28,0,1,0-51.12,15.77l-26.79,33L146,73.4a28,28,0,1,0-36.06,0L85.91,128.74l-26.79-33a28,28,0,1,0-26.6,12L47,194.63A16,16,0,0,0,62.78,208H193.22A16,16,0,0,0,209,194.63l14.47-86.85A28,28,0,0,0,248,80ZM128,40a12,12,0,1,1-12,12A12,12,0,0,1,128,40ZM24,80A12,12,0,1,1,36,92,12,12,0,0,1,24,80ZM220,92a12,12,0,1,1,12-12A12,12,0,0,1,220,92Z";

export default function AppleIcon() {
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
        }}
      >
        <svg width={104} height={104} viewBox="0 0 256 256">
          <path d={CROWN_PATH} fill="#c89b3c" />
        </svg>
      </div>
    ),
    size
  );
}
