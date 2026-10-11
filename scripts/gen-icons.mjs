import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const OUT = "public/icons";
await mkdir(OUT, { recursive: true });

const density = 1200;

const base = await sharp(`${OUT}/icon.svg`, { density }).resize(512, 512).png().toBuffer();

await sharp(base).resize(192, 192).toFile(`${OUT}/pwa-192.png`);
await sharp(base).toFile(`${OUT}/pwa-512.png`);

await sharp(`${OUT}/maskable.svg`, { density })
  .resize(512, 512)
  .png()
  .toFile(`${OUT}/maskable-512.png`);

// Apple touch icons dislike transparency — flatten onto the OLED background.
await sharp({
  create: { width: 180, height: 180, channels: 4, background: "#050507" },
})
  .composite([{ input: await sharp(base).resize(180, 180).png().toBuffer() }])
  .png()
  .toFile(`${OUT}/apple-touch-icon.png`);

console.log("icons generated:", OUT);
