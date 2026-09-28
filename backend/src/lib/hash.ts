import CryptoJS from 'crypto-js';

export function computeSHA256(data: string): string {
  return '0x' + CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
}

export function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return computeSHA256('');
  if (hashes.length === 1) return hashes[0];

  const nextLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = i + 1 < hashes.length ? hashes[i + 1] : left;
    nextLevel.push(computeSHA256(left + right));
  }
  return computeMerkleRoot(nextLevel);
}

export function generateSignature(data: string): string {
  // Simplified HMAC-based signature for demo purposes
  const secret = process.env.SIGNING_SECRET || 'ulpf-demo-secret-key';
  return 'ECDSA-SHA256:' + CryptoJS.HmacSHA256(data, secret).toString(CryptoJS.enc.Hex).substring(0, 16) + '...';
}
