"use client";

import { entropyToMnemonic, mnemonicToEntropy } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/spanish.js";

const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const QR_PREFIX = "Z4SK-KEY-V1";
const CONTEXT = new TextEncoder().encode("z4sk-shared-key-v1");
const asBufferSource = (bytes: Uint8Array) => bytes as unknown as BufferSource;

export function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function fromBase64Url(value: string) {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function isSharedKey(value: string) {
  return KEY_PATTERN.test(value);
}

export function generateSharedKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  try {
    return toBase64Url(bytes);
  } finally {
    bytes.fill(0);
  }
}

export function sharedKeyToMnemonic(sharedKey: string) {
  if (!isSharedKey(sharedKey)) throw new Error("Invalid shared key.");
  const bytes = fromBase64Url(sharedKey);
  try {
    if (bytes.length !== 32) throw new Error("Invalid shared key length.");
    return entropyToMnemonic(bytes, wordlist);
  } finally {
    bytes.fill(0);
  }
}

export function mnemonicToSharedKey(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFKD");
  const entropy = mnemonicToEntropy(normalized, wordlist);
  try {
    if (entropy.length !== 32)
      throw new Error("The recovery phrase must contain 24 valid words.");
    return toBase64Url(entropy);
  } finally {
    entropy.fill(0);
  }
}

async function digestSharedKey(sharedKey: string) {
  if (!isSharedKey(sharedKey)) throw new Error("Invalid shared key.");
  const key = fromBase64Url(sharedKey);
  const material = new Uint8Array(CONTEXT.length + key.length);
  material.set(CONTEXT);
  material.set(key, CONTEXT.length);
  try {
    return new Uint8Array(
      await crypto.subtle.digest("SHA-256", asBufferSource(material)),
    );
  } finally {
    key.fill(0);
    material.fill(0);
  }
}

export async function sharedKeyFingerprint(sharedKey: string) {
  const digest = await digestSharedKey(sharedKey);
  try {
    return (
      [...digest.subarray(0, 8)]
        .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
        .join("")
        .match(/.{1,4}/g)
        ?.join("-") || ""
    );
  } finally {
    digest.fill(0);
  }
}

export async function encodeSharedKeyQr(sharedKey: string) {
  const digest = await digestSharedKey(sharedKey);
  try {
    return `${QR_PREFIX}:${sharedKey}:${toBase64Url(digest.subarray(0, 4))}`;
  } finally {
    digest.fill(0);
  }
}

export async function decodeSharedKeyQr(value: string) {
  const [prefix, sharedKey, checksum, ...extra] = value.trim().split(":");
  if (
    prefix !== QR_PREFIX ||
    !sharedKey ||
    !checksum ||
    extra.length ||
    !isSharedKey(sharedKey)
  )
    throw new Error("This is not a valid Z4SK shared-key QR.");
  const expectedPayload = await encodeSharedKeyQr(sharedKey);
  const expectedChecksum = expectedPayload.split(":")[2] || "";
  let difference = expectedChecksum.length ^ checksum.length;
  for (
    let index = 0;
    index < Math.min(expectedChecksum.length, checksum.length);
    index += 1
  )
    difference |=
      expectedChecksum.charCodeAt(index) ^ checksum.charCodeAt(index);
  if (difference !== 0)
    throw new Error("The shared-key QR checksum is invalid.");
  return sharedKey;
}
