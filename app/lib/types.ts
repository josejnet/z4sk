export type Level = "curioso" | "coqueto" | "picante" | "sinfiltro";

export type Game = {
  id: string;
  creatorName: string;
  creatorEmail?: string;
  recipientName: string;
  title: string;
  level: Level;
  locale: Locale;
  libraryVersion: string;
  doubleBlind: boolean;
  expiresAt: string;
  openedAt?: string | null;
  packSlug: string;
  questions: string[];
  premium: boolean;
  viewOnce: boolean;
  createdAt: string;
  responseCount?: number;
  encryptionPublicKey: EncryptionPublicKey;
};

export type GameResponse = {
  id: string;
  respondentName: string;
  answers: string[];
  reactions: string[];
  matched: boolean;
  createdAt: string;
};

export type StoredEncryptedResponse = {
  id: string;
  encryptedPayload: EncryptedResponseEnvelope;
  createdAt: string;
};

import type { Locale } from "./i18n";
import type { EncryptedResponseEnvelope, EncryptionPublicKey } from "./encryption-types";
