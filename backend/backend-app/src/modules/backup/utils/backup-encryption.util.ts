import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { open } from 'fs/promises';
import { pipeline } from 'stream/promises';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function loadKey(): Buffer {
  const hex = process.env.BACKUP_ENCRYPTION_KEY;

  if (!hex || hex.length !== 64) {
    throw new Error(
      'BACKUP_ENCRYPTION_KEY must be set to a 64-character hex string (32 bytes).',
    );
  }

  return Buffer.from(hex, 'hex');
}

/*
 * File layout: [12-byte IV][16-byte auth tag][ciphertext]. The auth
 * tag is written up front (once the cipher finalizes) rather than
 * appended, so decryption can read it before streaming the body.
 */
export async function encryptFile(
  sourcePath: string,
  destPath: string,
): Promise<void> {
  const key = loadKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const source = createReadStream(sourcePath);
  const dest = createWriteStream(destPath);

  dest.write(iv);

  const authTagPlaceholder = Buffer.alloc(AUTH_TAG_LENGTH);
  const authTagOffset = IV_LENGTH;
  dest.write(authTagPlaceholder);

  await pipeline(source, cipher, dest, { end: false });

  const authTag = cipher.getAuthTag();

  await new Promise<void>((resolve, reject) => {
    dest.end((error?: Error | null) => {
      if (error) reject(error);
      else resolve();
    });
  });

  const handle = await open(destPath, 'r+');
  try {
    await handle.write(authTag, 0, authTag.length, authTagOffset);
  } finally {
    await handle.close();
  }
}

export async function decryptFile(
  sourcePath: string,
  destPath: string,
): Promise<void> {
  const key = loadKey();

  const handle = await open(sourcePath, 'r');

  const header = Buffer.alloc(IV_LENGTH + AUTH_TAG_LENGTH);
  await handle.read(header, 0, header.length, 0);
  await handle.close();

  const iv = header.subarray(0, IV_LENGTH);
  const authTag = header.subarray(IV_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const source = createReadStream(sourcePath, {
    start: IV_LENGTH + AUTH_TAG_LENGTH,
  });
  const dest = createWriteStream(destPath);

  await pipeline(source, decipher, dest);
}
