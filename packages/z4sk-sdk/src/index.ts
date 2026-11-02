export type Z4skLocale =
  | "en"
  | "es"
  | "it"
  | "fr"
  | "de"
  | "nl"
  | "eo"
  | "pt"
  | "zh"
  | "hi"
  | "ja"
  | "tr"
  | "machine";
export type Z4skLevel = "curioso" | "coqueto" | "picante" | "sinfiltro";
export type CreateQuizInput = {
  creatorName: string;
  recipientName: string;
  locale?: Z4skLocale;
  level: Z4skLevel;
  questions: string[];
  sharedKey: string;
  viewOnce?: boolean;
  doubleBlind?: boolean;
  matchQuestion?: string;
  timedMode?: boolean;
  creatorInterest?: boolean;
  expiresInHours?: 12 | 24 | 48 | 72;
  packSlug?: "original" | "nightlife" | "creator";
};
export type CreatedQuiz = { id: string; playUrl: string; adminUrl: string };

async function responseKeys() {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey("jwk", pair.publicKey),
    crypto.subtle.exportKey("jwk", pair.privateKey),
  ]);
  if (!publicKey.x || !publicKey.y || !privateKey.d)
    throw new Error("Could not generate Z4SK response encryption keys");
  return {
    publicKey: { kty: "EC", crv: "P-256", x: publicKey.x, y: publicKey.y },
    privateSecret: privateKey.d,
  };
}

function attachSecret(
  adminUrl: string,
  privateSecret: string,
  creatorInterest: boolean,
) {
  const url = new URL(adminUrl);
  const fragment = new URLSearchParams(url.hash.slice(1));
  fragment.set("decrypt", privateSecret);
  fragment.set("interest", creatorInterest ? "1" : "0");
  url.hash = fragment.toString();
  return url.toString();
}

function attachInvitation(urlValue: string, secret: string) {
  const url = new URL(urlValue);
  const fragment = new URLSearchParams(url.hash.slice(1));
  fragment.set("invite", secret);
  url.hash = fragment.toString();
  return url.toString();
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
async function creatorAccess() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  try {
    const token = base64Url(bytes);
    const digest = new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
    );
    try {
      return {
        token,
        tokenHash: [...digest]
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join(""),
      };
    } finally {
      digest.fill(0);
    }
  } finally {
    bytes.fill(0);
  }
}
function invitationSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  try {
    return base64Url(bytes);
  } finally {
    bytes.fill(0);
  }
}
export function generateSharedKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  try {
    return base64Url(bytes);
  } finally {
    bytes.fill(0);
  }
}
function decodeBase64Url(value: string) {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}
async function encryptInvitation(
  payload: Record<string, unknown>,
  linkSecret: string,
  sharedKey: string,
) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(sharedKey))
    throw new Error("A 256-bit Z4SK shared key is required");
  const linkBytes = decodeBase64Url(linkSecret);
  const sharedBytes = decodeBase64Url(sharedKey);
  if (linkBytes.length !== 32 || sharedBytes.length !== 32)
    throw new Error("Invalid Z4SK key length");
  const input = new Uint8Array(64);
  input.set(linkBytes);
  input.set(sharedBytes, 32);
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const keyIv = crypto.getRandomValues(new Uint8Array(12));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const contentKeyBytes = crypto.getRandomValues(new Uint8Array(32));
  const clear = new TextEncoder().encode(JSON.stringify(payload));
  const keyContext = new TextEncoder().encode("z4sk-invitation-key-v2");
  const contentContext = new TextEncoder().encode("z4sk-invitation-content-v2");
  try {
    const material = await crypto.subtle.importKey(
      "raw",
      input,
      "HKDF",
      false,
      ["deriveKey"],
    );
    const [wrappingKey, contentKey] = await Promise.all([
      crypto.subtle.deriveKey(
        { name: "HKDF", hash: "SHA-256", salt, info: keyContext },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"],
      ),
      crypto.subtle.importKey("raw", contentKeyBytes, "AES-GCM", false, [
        "encrypt",
      ]),
    ]);
    const [wrappedKey, encrypted] = await Promise.all([
      crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: keyIv,
          additionalData: keyContext,
          tagLength: 128,
        },
        wrappingKey,
        contentKeyBytes,
      ),
      crypto.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: contentContext, tagLength: 128 },
        contentKey,
        clear,
      ),
    ]);
    return {
      v: 2,
      alg: "HKDF-SHA256+A256GCM+A256GCM",
      salt: base64Url(salt),
      keyIv: base64Url(keyIv),
      wrappedKey: base64Url(new Uint8Array(wrappedKey)),
      iv: base64Url(iv),
      ciphertext: base64Url(new Uint8Array(encrypted)),
    };
  } finally {
    linkBytes.fill(0);
    sharedBytes.fill(0);
    input.fill(0);
    salt.fill(0);
    keyIv.fill(0);
    iv.fill(0);
    contentKeyBytes.fill(0);
    clear.fill(0);
  }
}

export class Z4skClient {
  constructor(private readonly baseUrl = "https://z4sk.example") {}
  async createQuiz(input: CreateQuizInput): Promise<CreatedQuiz> {
    const [keys, access] = await Promise.all([responseKeys(), creatorAccess()]);
    const secret = invitationSecret();
    const encryptedInvitation = await encryptInvitation(
      {
        creatorName: input.creatorName.trim(),
        recipientName: input.recipientName.trim(),
        title: `${input.recipientName.trim()} · Z4SK`,
        locale: input.locale || "en",
        level: input.level,
        questions: input.questions,
        viewOnce: undefined,
        doubleBlind: Boolean(input.doubleBlind),
        matchQuestion: input.doubleBlind ? input.matchQuestion || "" : "",
        timedMode: Boolean(input.timedMode),
        packSlug: input.packSlug || "original",
        encryptionPublicKey: keys.publicKey,
        libraryVersion: "2026.11",
        createdAt: new Date().toISOString(),
      },
      secret,
      input.sharedKey,
    );
    const response = await fetch(`${this.baseUrl}/api/games`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        encryptedInvitation,
        questionCount: input.questions.length,
        viewOnce: Boolean(input.viewOnce),
        expiresInHours: input.expiresInHours || 12,
        creatorTokenHash: access.tokenHash,
        source: "sdk",
      }),
    });
    if (!response.ok) throw new Error(`Z4SK API returned ${response.status}`);
    const created = (await response.json()) as Omit<CreatedQuiz, "adminUrl">;
    const playUrl = attachInvitation(created.playUrl, secret);
    const privateUrl = attachInvitation(
      `${this.baseUrl.replace(/\/$/, "")}/p/${created.id}#key=${encodeURIComponent(access.token)}`,
      secret,
    );
    return {
      ...created,
      playUrl,
      adminUrl: attachSecret(
        privateUrl,
        keys.privateSecret,
        Boolean(input.doubleBlind && input.creatorInterest),
      ),
    };
  }
  mount(
    target: HTMLElement,
    options: { locale?: Z4skLocale; label?: string; height?: number } = {},
  ) {
    const iframe = document.createElement("iframe");
    iframe.src = `${this.baseUrl}/?embed=1&locale=${options.locale || "en"}`;
    iframe.title = options.label || "Create a Z4SK questionnaire";
    iframe.loading = "lazy";
    iframe.allow = "camera; clipboard-write; web-share";
    iframe.style.cssText = `width:100%;height:${options.height || 760}px;border:0;background:#0b0b0b`;
    target.replaceChildren(iframe);
    return () => iframe.remove();
  }
}
