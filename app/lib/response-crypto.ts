"use client";

import type { EncryptedResponseEnvelope, EncryptionPublicKey, PrivateResponsePayload } from "./encryption-types";
import { isEncryptedResponseEnvelope } from "./encryption-types";

const CONTEXT = new TextEncoder().encode("z4sk-response-v1");

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function publicJwk(key: EncryptionPublicKey): JsonWebKey {
  return { kty: key.kty, crv: key.crv, x: key.x, y: key.y, ext: true, key_ops: [] };
}

async function deriveContentKey(privateKey: CryptoKey, peerPublicKey: CryptoKey, salt: Uint8Array, usage: KeyUsage) {
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: peerPublicKey }, privateKey, 256));
  try {
    const material = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
    return await crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt, info: CONTEXT }, material, { name: "AES-GCM", length: 256 }, false, [usage]);
  } finally {
    shared.fill(0);
  }
}

export async function generateResponseKeyPair() {
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const [exportedPublic, exportedPrivate] = await Promise.all([
    crypto.subtle.exportKey("jwk", pair.publicKey),
    crypto.subtle.exportKey("jwk", pair.privateKey),
  ]);
  if (!exportedPublic.x || !exportedPublic.y || !exportedPrivate.d) throw new Error("Could not export the encryption key pair.");
  return {
    publicKey: { kty: "EC", crv: "P-256", x: exportedPublic.x, y: exportedPublic.y } satisfies EncryptionPublicKey,
    privateSecret: exportedPrivate.d,
  };
}

export function attachPrivateDecryptionKey(adminUrl: string, privateSecret: string, creatorInterest: boolean) {
  const url = new URL(adminUrl);
  const fragment = new URLSearchParams(url.hash.slice(1));
  fragment.set("decrypt", privateSecret);
  fragment.set("interest", creatorInterest ? "1" : "0");
  url.hash = fragment.toString();
  return url.toString();
}

export async function verifyPrivateDecryptionKey(recipientPublicKey: EncryptionPublicKey, privateSecret: string) {
  const publicKey = await crypto.subtle.importKey("jwk", publicJwk(recipientPublicKey), { name: "ECDH", namedCurve: "P-256" }, false, []);
  const privateKey = await crypto.subtle.importKey("jwk", { ...publicJwk(recipientPublicKey), d: privateSecret, key_ops: ["deriveBits"] }, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
  const challenge = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
  const [fromPrivate, fromPublic] = await Promise.all([
    crypto.subtle.deriveBits({ name: "ECDH", public: challenge.publicKey }, privateKey, 256),
    crypto.subtle.deriveBits({ name: "ECDH", public: publicKey }, challenge.privateKey, 256),
  ]);
  const left = new Uint8Array(fromPrivate);
  const right = new Uint8Array(fromPublic);
  try {
    let difference = left.length ^ right.length;
    for (let index = 0; index < Math.min(left.length, right.length); index += 1) difference |= left[index] ^ right[index];
    if (difference !== 0) throw new Error("The private decryption key does not match this invitation.");
  } finally {
    left.fill(0);
    right.fill(0);
  }
}

export async function encryptPrivateResponse(payload: PrivateResponsePayload, recipientPublicKey: EncryptionPublicKey): Promise<EncryptedResponseEnvelope> {
  const recipientKey = await crypto.subtle.importKey("jwk", publicJwk(recipientPublicKey), { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ephemeral = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const exportedEphemeral = await crypto.subtle.exportKey("jwk", ephemeral.publicKey);
  if (!exportedEphemeral.x || !exportedEphemeral.y) throw new Error("Could not export the ephemeral key.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const contentKey = await deriveContentKey(ephemeral.privateKey, recipientKey, salt, "encrypt");
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  try {
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: CONTEXT, tagLength: 128 }, contentKey, plaintext);
    return {
      v: 1,
      alg: "ECDH-P256+HKDF-SHA256+A256GCM",
      ephemeralPublicKey: { kty: "EC", crv: "P-256", x: exportedEphemeral.x, y: exportedEphemeral.y },
      salt: toBase64Url(salt),
      iv: toBase64Url(iv),
      ciphertext: toBase64Url(new Uint8Array(ciphertext)),
    };
  } finally {
    plaintext.fill(0);
    salt.fill(0);
    iv.fill(0);
  }
}

export async function decryptPrivateResponse(envelope: EncryptedResponseEnvelope, recipientPublicKey: EncryptionPublicKey, privateSecret: string): Promise<PrivateResponsePayload> {
  if (!isEncryptedResponseEnvelope(envelope)) throw new Error("Invalid encrypted response envelope.");
  const privateKey = await crypto.subtle.importKey("jwk", { ...publicJwk(recipientPublicKey), d: privateSecret, key_ops: ["deriveBits"] }, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
  const ephemeralKey = await crypto.subtle.importKey("jwk", publicJwk(envelope.ephemeralPublicKey), { name: "ECDH", namedCurve: "P-256" }, false, []);
  const salt = fromBase64Url(envelope.salt);
  const iv = fromBase64Url(envelope.iv);
  const ciphertext = fromBase64Url(envelope.ciphertext);
  const contentKey = await deriveContentKey(privateKey, ephemeralKey, salt, "decrypt");
  let clear = new Uint8Array();
  try {
    clear = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: CONTEXT, tagLength: 128 }, contentKey, ciphertext));
    const payload = JSON.parse(new TextDecoder().decode(clear)) as Partial<PrivateResponsePayload>;
    if (typeof payload.respondentName !== "string" || payload.respondentName.length < 2 || payload.respondentName.length > 40 || !Array.isArray(payload.answers) || payload.answers.some((answer) => typeof answer !== "string" || !answer || answer.length > 800) || !Array.isArray(payload.reactions) || payload.reactions.some((reaction) => typeof reaction !== "string") || !(payload.matchInterest === null || typeof payload.matchInterest === "boolean")) throw new Error("Invalid decrypted response.");
    return payload as PrivateResponsePayload;
  } finally {
    clear.fill(0);
    salt.fill(0);
    iv.fill(0);
    ciphertext.fill(0);
  }
}
