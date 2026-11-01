export type EncryptionPublicKey = {
  kty: "EC";
  crv: "P-256";
  x: string;
  y: string;
};

export type EncryptedResponseEnvelope = {
  v: 1;
  alg: "ECDH-P256+HKDF-SHA256+A256GCM";
  ephemeralPublicKey: EncryptionPublicKey;
  salt: string;
  iv: string;
  ciphertext: string;
};

export type EncryptedInvitationEnvelope = {
  v: 1;
  alg: "A256GCM";
  iv: string;
  ciphertext: string;
};

export type PrivateResponsePayload = {
  respondentName: string;
  answers: string[];
  reactions: string[];
  matchInterest: boolean | null;
};

const BASE64URL = /^[A-Za-z0-9_-]+$/;

export function isEncryptionPublicKey(value: unknown): value is EncryptionPublicKey {
  if (!value || typeof value !== "object") return false;
  const key = value as Partial<EncryptionPublicKey>;
  return key.kty === "EC" && key.crv === "P-256" && typeof key.x === "string" && key.x.length === 43 && BASE64URL.test(key.x) && typeof key.y === "string" && key.y.length === 43 && BASE64URL.test(key.y);
}

export function isEncryptedResponseEnvelope(value: unknown): value is EncryptedResponseEnvelope {
  if (!value || typeof value !== "object") return false;
  const envelope = value as Partial<EncryptedResponseEnvelope>;
  return envelope.v === 1 && envelope.alg === "ECDH-P256+HKDF-SHA256+A256GCM" && isEncryptionPublicKey(envelope.ephemeralPublicKey) && typeof envelope.salt === "string" && envelope.salt.length === 22 && BASE64URL.test(envelope.salt) && typeof envelope.iv === "string" && envelope.iv.length === 16 && BASE64URL.test(envelope.iv) && typeof envelope.ciphertext === "string" && envelope.ciphertext.length >= 24 && envelope.ciphertext.length <= 30_000 && BASE64URL.test(envelope.ciphertext);
}

export function isEncryptedInvitationEnvelope(value: unknown): value is EncryptedInvitationEnvelope {
  if (!value || typeof value !== "object") return false;
  const envelope = value as Partial<EncryptedInvitationEnvelope>;
  return envelope.v === 1 && envelope.alg === "A256GCM" && typeof envelope.iv === "string" && envelope.iv.length === 16 && BASE64URL.test(envelope.iv) && typeof envelope.ciphertext === "string" && envelope.ciphertext.length >= 64 && envelope.ciphertext.length <= 12_000 && BASE64URL.test(envelope.ciphertext);
}
