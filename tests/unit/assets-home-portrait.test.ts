import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const portraitPath = fileURLToPath(new URL('../../src/assets/people/trey-turner.jpg', import.meta.url));

// Inspect marker headers only: never print potentially private metadata payloads.
function assertPrivateMetadataAbsent(jpeg: Buffer) {
  expect(jpeg.readUInt16BE(0)).toBe(0xffd8);
  let offset = 2;
  let inScan = false;
  while (offset < jpeg.length) {
    if (inScan) offset = jpeg.indexOf(0xff, offset);
    expect(offset).toBeGreaterThanOrEqual(0);
    expect(jpeg[offset]).toBe(0xff);
    while (jpeg[offset] === 0xff) offset++;
    const marker = jpeg[offset++];
    // Entropy-coded bytes and restart markers are not metadata segments.
    if (inScan && (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7))) continue;
    if (marker === 0xd9) {
      expect(offset, 'No data may follow the end of the JPEG').toBe(jpeg.length);
      return;
    }
    const length = jpeg.readUInt16BE(offset);
    expect(length).toBeGreaterThanOrEqual(2);
    expect(offset + length).toBeLessThanOrEqual(jpeg.length);
    expect(marker, 'JPEG comments may contain private information').not.toBe(0xfe);
    if (marker >= 0xe0 && marker <= 0xef) {
      // Keep only the ICC color profile and Adobe color-transform information.
      expect([0xe2, 0xee], 'Unexpected JPEG application metadata').toContain(marker);
      const signature = Buffer.from(marker === 0xe2 ? 'ICC_PROFILE\0' : 'Adobe');
      expect(jpeg.subarray(offset + 2, offset + 2 + signature.length).equals(signature)).toBe(true);
      if (marker === 0xee) expect(length).toBe(14);
    }
    offset += length;
    inScan = marker === 0xda;
  }
  throw new Error('Missing JPEG end marker');
}

describe('homepage portrait privacy', () => {
  it('keeps private metadata out of the committed JPEG, not just the generated WebP', () => {
    assertPrivateMetadataAbsent(readFileSync(portraitPath));
  });

  for (const [name, marker] of [['EXIF/XMP', 0xe1], ['IPTC/Photoshop', 0xed], ['comment', 0xfe]] as const) {
    it(`rejects a reintroduced ${name} segment`, () => {
      const jpeg = readFileSync(portraitPath);
      const segment = Buffer.from([0xff, marker, 0x00, 0x04, 0x00, 0x00]);
      expect(() => assertPrivateMetadataAbsent(Buffer.concat([jpeg.subarray(0, 2), segment, jpeg.subarray(2)]))).toThrow();
    });
  }
});
