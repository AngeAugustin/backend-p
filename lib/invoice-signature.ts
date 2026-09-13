import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const SIGNATURE_FILE = path.join(process.cwd(), "public/images/signature.png");

let cachedSrc: string | null | undefined;

function toInkSignature(source: PNG) {
  let minX = source.width;
  let minY = source.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const i = (source.width * y + x) << 2;
      const luminance =
        (source.data[i] + source.data[i + 1] + source.data[i + 2]) / 3;
      const alpha = Math.round((luminance / 255) * source.data[i + 3]);
      if (alpha > 18) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return source;

  const pad = 8;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(source.width - cropX, maxX - minX + 1 + pad * 2);
  const cropH = Math.min(source.height - cropY, maxY - minY + 1 + pad * 2);
  const cropped = new PNG({ width: cropW, height: cropH });

  for (let y = 0; y < cropH; y += 1) {
    for (let x = 0; x < cropW; x += 1) {
      const srcI = (source.width * (cropY + y) + (cropX + x)) << 2;
      const destI = (cropW * y + x) << 2;
      const luminance =
        (source.data[srcI] + source.data[srcI + 1] + source.data[srcI + 2]) / 3;
      cropped.data[destI] = 16;
      cropped.data[destI + 1] = 44;
      cropped.data[destI + 2] = 39;
      cropped.data[destI + 3] = Math.round(
        (luminance / 255) * source.data[srcI + 3]
      );
    }
  }

  return cropped;
}

export function getInvoiceSignatureSrc() {
  if (cachedSrc !== undefined) return cachedSrc;
  if (!fs.existsSync(SIGNATURE_FILE)) {
    cachedSrc = null;
    return cachedSrc;
  }

  const png = PNG.sync.read(fs.readFileSync(SIGNATURE_FILE));
  const ink = toInkSignature(png);
  cachedSrc = `data:image/png;base64,${PNG.sync.write(ink).toString("base64")}`;
  return cachedSrc;
}
