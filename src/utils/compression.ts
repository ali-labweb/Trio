import LZString from 'lz-string';

export function compressToUrl(data: unknown): string {
  const json = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(json);
}

export function decompressFromUrl(compressed: string): unknown {
  const json = LZString.decompressFromEncodedURIComponent(compressed);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
