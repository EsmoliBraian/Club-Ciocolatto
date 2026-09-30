/**
 * Fetches a Google Font's actual TTF bytes for use with next/og's
 * ImageResponse (which needs raw font data, unlike next/font/google's
 * CSS-only loading). Standard pattern for this — see Vercel's own
 * @vercel/og examples.
 */
export async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer> {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&text=${encodeURIComponent(text)}`)
  ).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error(`Could not resolve a font URL for ${family}`);
  const fontResponse = await fetch(match[1]);
  return fontResponse.arrayBuffer();
}
