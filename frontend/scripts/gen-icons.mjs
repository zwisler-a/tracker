/**
 * Generates icon-192.png and icon-512.png from public/icon.svg.
 * Requires: npm install --save-dev sharp
 * Run once: npm run gen-icons
 */
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

for (const size of [192, 512]) {
  await sharp(join(dir, 'icon.svg'))
    .resize(size, size)
    .png()
    .toFile(join(dir, `icon-${size}.png`))
  console.log(`✓ icon-${size}.png`)
}