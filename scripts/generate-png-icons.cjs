const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const crcData = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generateIconPNG(width, height, isMaskable = false) {
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const rawData = Buffer.alloc((stride + 1) * height);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * bytesPerPixel;
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background: Deep industrial gradient
      const gradRatio = (x + y) / (width + height);
      let r = Math.round(7 + gradRatio * 15);
      let g = Math.round(10 + gradRatio * 20);
      let b = Math.round(20 + gradRatio * 35);
      let a = 255;

      if (!isMaskable) {
        // Rounded corner container
        const cornerRadius = 0.22;
        const cornerDistX = Math.max(0, Math.abs(dx) - (1 - cornerRadius));
        const cornerDistY = Math.max(0, Math.abs(dy) - (1 - cornerRadius));
        const cornerDist = Math.sqrt(cornerDistX * cornerDistX + cornerDistY * cornerDistY);
        if (cornerDist > cornerRadius) {
          a = 0;
        }
      }

      if (a > 0) {
        // Outer decorative pulse rings
        if (Math.abs(dist - 0.78) < 0.015) {
          r = 14; g = 165; b = 233; // Cyan pulse
        } else if (Math.abs(dist - 0.65) < 0.015) {
          r = 16; g = 185; b = 129; // Emerald pulse
        }

        // Central Prism Geometry (Triangular / Faceted shape inside center)
        const py = dy * 2.2 + 0.1;
        const px = Math.abs(dx) * 2.2;
        if (py > -0.65 && py < 0.65 && px < (0.65 - (py * 0.35))) {
          if (dx < 0) {
            // Left facet - Cyan/Emerald
            r = Math.round(6 + (py + 0.65) * 20);
            g = Math.round(182 - (px * 80));
            b = Math.round(212 - (px * 40));
          } else {
            // Right facet - Electric Blue
            r = Math.round(56 - (px * 30));
            g = Math.round(140 + (py + 0.65) * 50);
            b = Math.round(248 - (py * 30));
          }

          // Center facet divider
          if (Math.abs(dx) < 0.03) {
            r = 255; g = 255; b = 255;
          }
        }

        // Horizontal Sensor Input Beam
        if (Math.abs(dy) < 0.03 && dx < -0.25 && dx > -0.85) {
          r = 56; g = 189; b = 248;
        }

        // Dispersed Refracted Beams (Emerald, Cyan, Violet)
        if (dx > 0.25 && dx < 0.85) {
          // Upper beam
          if (Math.abs(dy - (-(dx - 0.25) * 0.45)) < 0.025) {
            r = 52; g = 211; b = 153;
          }
          // Middle beam
          if (Math.abs(dy) < 0.025) {
            r = 34; g = 211; b = 238;
          }
          // Lower beam
          if (Math.abs(dy - ((dx - 0.25) * 0.45)) < 0.025) {
            r = 129; g = 140; b = 248;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA Icons
console.log('Generating PWA Icons...');

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateIconPNG(192, 192, false));
console.log('Created pwa-192x192.png');

fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateIconPNG(512, 512, false));
console.log('Created pwa-512x512.png');

fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateIconPNG(512, 512, true));
console.log('Created pwa-maskable-512x512.png');

fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateIconPNG(180, 180, false));
console.log('Created apple-touch-icon.png');

fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generateIconPNG(48, 48, false));
console.log('Created favicon.ico');

console.log('All PWA icons generated successfully.');
