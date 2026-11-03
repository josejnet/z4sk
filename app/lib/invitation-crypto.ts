"use client";

import {
  isEncryptedInvitationEnvelope,
  isEncryptionPublicKey,
  type EncryptedInvitationEnvelope,
} from "./encryption-types";
import { fromBase64Url, isSharedKey, toBase64Url } from "./shared-key";
import type { EncryptedGameWire, Game, GameWire, Level } from "./types";
import type { Locale } from "./i18n";

const KEY_CONTEXT = new TextEncoder().encode("z4sk-invitation-key-v2");
const LINK_ONLY_KEY_CONTEXT = new TextEncoder().encode(
  "z4sk-invitation-key-v2-link-only",
);
const CONTENT_CONTEXT = new TextEncoder().encode("z4sk-invitation-content-v2");
const LEVELS = new Set<Level>(["curioso", "coqueto", "picante", "sinfiltro"]);
const LOCALES = new Set<Locale>([
  "en",
  "es",
  "it",
  "fr",
  "de",
  "nl",
  "eo",
  "pt",
  "zh",
  "hi",
  "ja",
  "tr",
  "machine",
]);
const PACKS = new Set(["original", "nightlife", "creator"]);
const BASE64URL_KEY = /^[A-Za-z0-9_-]{43}$/;
const BASE64URL_BEARER = /^[A-Za-z0-9_-]{32}$/;
const asBufferSource = (bytes: Uint8Array) => bytes as unknown as BufferSource;

export type PrivateInvitationPayload = Pick<
  Game,
  | "creatorName"
  | "recipientName"
  | "title"
  | "level"
  | "locale"
  | "libraryVersion"
  | "timedMode"
  | "packSlug"
  | "questions"
  | "encryptionPublicKey"
  | "createdAt"
>;

function validPayload(value: unknown): value is PrivateInvitationPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<PrivateInvitationPayload>;
  return (
    typeof payload.creatorName === "string" &&
    payload.creatorName.trim().length >= 1 &&
    payload.creatorName.length <= 40 &&
    typeof payload.recipientName === "string" &&
    payload.recipientName.trim().length >= 1 &&
    payload.recipientName.length <= 40 &&
    typeof payload.title === "string" &&
    payload.title.length >= 1 &&
    payload.title.length <= 100 &&
    typeof payload.level === "string" &&
    LEVELS.has(payload.level as Level) &&
    typeof payload.locale === "string" &&
    LOCALES.has(payload.locale as Locale) &&
    typeof payload.libraryVersion === "string" &&
    payload.libraryVersion.length >= 1 &&
    payload.libraryVersion.length <= 20 &&
    typeof payload.timedMode === "boolean" &&
    typeof payload.packSlug === "string" &&
    PACKS.has(payload.packSlug) &&
    Array.isArray(payload.questions) &&
    payload.questions.length >= 3 &&
    payload.questions.length <= 12 &&
    payload.questions.every(
      (question) =>
        typeof question === "string" &&
        question.length >= 5 &&
        question.length <= 180,
    ) &&
    new Set(payload.questions).size === payload.questions.length &&
    isEncryptionPublicKey(payload.encryptionPublicKey) &&
    typeof payload.createdAt === "string" &&
    Number.isFinite(new Date(payload.createdAt).getTime())
  );
}

function decodeSecret(value: string, label: string) {
  if (!BASE64URL_KEY.test(value))
    throw new Error(`The invitation is missing a valid ${label}.`);
  const bytes = fromBase64Url(value);
  if (bytes.length !== 32) {
    bytes.fill(0);
    throw new Error(`The ${label} has an invalid length.`);
  }
  return bytes;
}

async function deriveWrappingKey(
  invitationSecret: string,
  sharedKey: string,
  salt: Uint8Array,
  usage: KeyUsage,
  keyMode: "link" | "shared",
) {
  if (keyMode === "shared" && !isSharedKey(sharedKey))
    throw new Error("A valid shared key is required.");
  const linkBytes = decodeSecret(invitationSecret, "link secret");
  const sharedBytes =
    keyMode === "shared" ? fromBase64Url(sharedKey) : new Uint8Array();
  if (
    keyMode === "shared" &&
    sharedBytes.length !== 16 &&
    sharedBytes.length !== 32
  ) {
    linkBytes.fill(0);
    sharedBytes.fill(0);
    throw new Error("The shared key has an invalid length.");
  }
  const input = new Uint8Array(linkBytes.length + sharedBytes.length);
  input.set(linkBytes);
  input.set(sharedBytes, linkBytes.length);
  try {
    const material = await crypto.subtle.importKey(
      "raw",
      asBufferSource(input),
      "HKDF",
      false,
      ["deriveKey"],
    );
    return await crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: asBufferSource(salt),
        info: asBufferSource(
          keyMode === "link" ? LINK_ONLY_KEY_CONTEXT : KEY_CONTEXT,
        ),
      },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      [usage],
    );
  } finally {
    linkBytes.fill(0);
    sharedBytes.fill(0);
    input.fill(0);
  }
}

export function generateInvitationSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  try {
    return toBase64Url(bytes);
  } finally {
    bytes.fill(0);
  }
}

export function attachInvitationSecret(
  urlValue: string,
  invitationSecret: string,
) {
  if (!BASE64URL_KEY.test(invitationSecret))
    throw new Error("Invalid invitation secret.");
  const url = new URL(urlValue);
  const fragment = new URLSearchParams(url.hash.slice(1));
  fragment.set("invite", invitationSecret);
  url.hash = fragment.toString();
  return url.toString();
}

export function attachSubmissionToken(urlValue: string, token: string) {
  if (!BASE64URL_BEARER.test(token))
    throw new Error("Invalid response submission token.");
  const url = new URL(urlValue);
  const fragment = new URLSearchParams(url.hash.slice(1));
  fragment.set("submit", token);
  url.hash = fragment.toString();
  return url.toString();
}

export async function encryptPrivateInvitation(
  payload: PrivateInvitationPayload,
  invitationSecret: string,
  sharedKey: string,
): Promise<EncryptedInvitationEnvelope> {
  if (!validPayload(payload))
    throw new Error("Invalid private invitation payload.");
  const keyMode = sharedKey ? "shared" : "link";
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const keyIv = crypto.getRandomValues(new Uint8Array(12));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const contentKeyBytes = crypto.getRandomValues(new Uint8Array(32));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  try {
    const [wrappingKey, contentKey] = await Promise.all([
      deriveWrappingKey(
        invitationSecret,
        sharedKey,
        salt,
        "encrypt",
        keyMode,
      ),
      crypto.subtle.importKey(
        "raw",
        asBufferSource(contentKeyBytes),
        { name: "AES-GCM" },
        false,
        ["encrypt"],
      ),
    ]);
    const [wrappedKey, encrypted] = await Promise.all([
      crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: asBufferSource(keyIv),
          additionalData: asBufferSource(
            keyMode === "link" ? LINK_ONLY_KEY_CONTEXT : KEY_CONTEXT,
          ),
          tagLength: 128,
        },
        wrappingKey,
        asBufferSource(contentKeyBytes),
      ),
      crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: asBufferSource(iv),
          additionalData: asBufferSource(CONTENT_CONTEXT),
          tagLength: 128,
        },
        contentKey,
        asBufferSource(plaintext),
      ),
    ]);
    return {
      v: 2,
      alg: "HKDF-SHA256+A256GCM+A256GCM",
      keyMode,
      salt: toBase64Url(salt),
      keyIv: toBase64Url(keyIv),
      wrappedKey: toBase64Url(new Uint8Array(wrappedKey)),
      iv: toBase64Url(iv),
      ciphertext: toBase64Url(new Uint8Array(encrypted)),
    };
  } finally {
    plaintext.fill(0);
    contentKeyBytes.fill(0);
    salt.fill(0);
    keyIv.fill(0);
    iv.fill(0);
  }
}

export async function decryptPrivateInvitation(
  envelope: EncryptedInvitationEnvelope,
  invitationSecret: string,
  sharedKey: string,
): Promise<PrivateInvitationPayload> {
  if (!isEncryptedInvitationEnvelope(envelope))
    throw new Error("Invalid encrypted invitation envelope.");
  const salt = fromBase64Url(envelope.salt);
  const keyIv = fromBase64Url(envelope.keyIv);
  const wrappedKey = fromBase64Url(envelope.wrappedKey);
  const iv = fromBase64Url(envelope.iv);
  const ciphertext = fromBase64Url(envelope.ciphertext);
  let contentKeyBytes = new Uint8Array();
  let plaintext = new Uint8Array();
  try {
    const keyMode = envelope.keyMode || "shared";
    const wrappingKey = await deriveWrappingKey(
      invitationSecret,
      sharedKey,
      salt,
      "decrypt",
      keyMode,
    );
    contentKeyBytes = new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: asBufferSource(keyIv),
          additionalData: asBufferSource(
            keyMode === "link" ? LINK_ONLY_KEY_CONTEXT : KEY_CONTEXT,
          ),
          tagLength: 128,
        },
        wrappingKey,
        asBufferSource(wrappedKey),
      ),
    );
    if (contentKeyBytes.length !== 32)
      throw new Error("Invalid wrapped content key.");
    const contentKey = await crypto.subtle.importKey(
      "raw",
      asBufferSource(contentKeyBytes),
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );
    plaintext = new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: asBufferSource(iv),
          additionalData: asBufferSource(CONTENT_CONTEXT),
          tagLength: 128,
        },
        contentKey,
        asBufferSource(ciphertext),
      ),
    );
    const payload = JSON.parse(new TextDecoder().decode(plaintext)) as unknown;
    if (!validPayload(payload))
      throw new Error("Invalid decrypted invitation.");
    return payload;
  } finally {
    salt.fill(0);
    keyIv.fill(0);
    wrappedKey.fill(0);
    iv.fill(0);
    ciphertext.fill(0);
    contentKeyBytes.fill(0);
    plaintext.fill(0);
  }
}

export async function hydrateGameWire(
  wire: GameWire,
  invitationSecret: string,
  sharedKey: string,
): Promise<Game> {
  if (!("encryptedInvitation" in wire)) return wire;
  const payload = await decryptPrivateInvitation(
    wire.encryptedInvitation,
    invitationSecret,
    sharedKey,
  );
  if (payload.questions.length !== wire.questionCount)
    throw new Error("Encrypted invitation question count mismatch.");
  return {
    id: wire.id,
    ...payload,
    expiresAt: wire.expiresAt,
    openedAt: wire.openedAt,
    premium: wire.premium,
    viewOnce: wire.viewOnce,
    responseCount: wire.responseCount,
  };
}

export function isEncryptedGameWire(wire: GameWire): wire is EncryptedGameWire {
  return "encryptedInvitation" in wire;
}
