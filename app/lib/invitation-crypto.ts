"use client";

import { isEncryptedInvitationEnvelope, isEncryptionPublicKey, type EncryptedInvitationEnvelope } from "./encryption-types";
import type { EncryptedGameWire, Game, GameWire, Level } from "./types";
import type { Locale } from "./i18n";

const CONTEXT = new TextEncoder().encode("z4sk-invitation-v1");
const LEVELS = new Set<Level>(["curioso", "coqueto", "picante", "sinfiltro"]);
const LOCALES = new Set<Locale>(["en", "es", "it", "fr", "de", "nl", "eo", "pt", "zh", "hi", "ja", "tr", "machine"]);
const PACKS = new Set(["original", "nightlife", "creator"]);
const BASE64URL_KEY = /^[A-Za-z0-9_-]{43}$/;
const asBufferSource = (bytes: Uint8Array) => bytes as unknown as BufferSource;

export type PrivateInvitationPayload = Pick<Game, "creatorName" | "recipientName" | "title" | "level" | "locale" | "libraryVersion" | "doubleBlind" | "matchQuestion" | "timedMode" | "packSlug" | "questions" | "encryptionPublicKey" | "createdAt">;

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

function validPayload(value: unknown): value is PrivateInvitationPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<PrivateInvitationPayload>;
  return typeof payload.creatorName === "string" && payload.creatorName.trim().length >= 1 && payload.creatorName.length <= 40
    && typeof payload.recipientName === "string" && payload.recipientName.trim().length >= 1 && payload.recipientName.length <= 40
    && typeof payload.title === "string" && payload.title.length >= 1 && payload.title.length <= 100
    && typeof payload.level === "string" && LEVELS.has(payload.level as Level)
    && typeof payload.locale === "string" && LOCALES.has(payload.locale as Locale)
    && typeof payload.libraryVersion === "string" && payload.libraryVersion.length >= 1 && payload.libraryVersion.length <= 20
    && typeof payload.doubleBlind === "boolean"
    && typeof payload.matchQuestion === "string" && payload.matchQuestion.length <= 180
    && typeof payload.timedMode === "boolean"
    && typeof payload.packSlug === "string" && PACKS.has(payload.packSlug)
    && Array.isArray(payload.questions) && payload.questions.length >= 3 && payload.questions.length <= 12
    && payload.questions.every((question) => typeof question === "string" && question.length >= 5 && question.length <= 180)
    && new Set(payload.questions).size === payload.questions.length
    && isEncryptionPublicKey(payload.encryptionPublicKey)
    && typeof payload.createdAt === "string" && Number.isFinite(new Date(payload.createdAt).getTime());
}

async function importInvitationKey(secret: string, usage: KeyUsage) {
  if (!BASE64URL_KEY.test(secret)) throw new Error("The invitation is missing a valid secret key.");
  const bytes = fromBase64Url(secret);
  try {
    if (bytes.length !== 32) throw new Error("The invitation secret key has an invalid length.");
    return await crypto.subtle.importKey("raw", asBufferSource(bytes), { name: "AES-GCM" }, false, [usage]);
  } finally {
    bytes.fill(0);
  }
}

export function generateInvitationSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  try { return toBase64Url(bytes); } finally { bytes.fill(0); }
}

export function attachInvitationSecret(urlValue: string, invitationSecret: string) {
  if (!BASE64URL_KEY.test(invitationSecret)) throw new Error("Invalid invitation secret.");
  const url = new URL(urlValue);
  const fragment = new URLSearchParams(url.hash.slice(1));
  fragment.set("invite", invitationSecret);
  url.hash = fragment.toString();
  return url.toString();
}

export async function encryptPrivateInvitation(payload: PrivateInvitationPayload, invitationSecret: string): Promise<EncryptedInvitationEnvelope> {
  if (!validPayload(payload)) throw new Error("Invalid private invitation payload.");
  const key = await importInvitationKey(invitationSecret, "encrypt");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  try {
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: asBufferSource(iv), additionalData: asBufferSource(CONTEXT), tagLength: 128 }, key, asBufferSource(plaintext));
    return { v: 1, alg: "A256GCM", iv: toBase64Url(iv), ciphertext: toBase64Url(new Uint8Array(encrypted)) };
  } finally {
    plaintext.fill(0);
    iv.fill(0);
  }
}

export async function decryptPrivateInvitation(envelope: EncryptedInvitationEnvelope, invitationSecret: string): Promise<PrivateInvitationPayload> {
  if (!isEncryptedInvitationEnvelope(envelope)) throw new Error("Invalid encrypted invitation envelope.");
  const key = await importInvitationKey(invitationSecret, "decrypt");
  const iv = fromBase64Url(envelope.iv);
  const ciphertext = fromBase64Url(envelope.ciphertext);
  let plaintext = new Uint8Array();
  try {
    plaintext = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: asBufferSource(iv), additionalData: asBufferSource(CONTEXT), tagLength: 128 }, key, asBufferSource(ciphertext)));
    const payload = JSON.parse(new TextDecoder().decode(plaintext)) as unknown;
    if (!validPayload(payload)) throw new Error("Invalid decrypted invitation.");
    return payload;
  } finally {
    plaintext.fill(0);
    iv.fill(0);
    ciphertext.fill(0);
  }
}

export async function hydrateGameWire(wire: GameWire, invitationSecret: string): Promise<Game> {
  if (!("encryptedInvitation" in wire)) return wire;
  const payload = await decryptPrivateInvitation(wire.encryptedInvitation, invitationSecret);
  if (payload.questions.length !== wire.questionCount) throw new Error("Encrypted invitation question count mismatch.");
  return { id: wire.id, ...payload, expiresAt: wire.expiresAt, openedAt: wire.openedAt, premium: wire.premium, viewOnce: wire.viewOnce, responseCount: wire.responseCount };
}

export function isEncryptedGameWire(wire: GameWire): wire is EncryptedGameWire {
  return "encryptedInvitation" in wire;
}
