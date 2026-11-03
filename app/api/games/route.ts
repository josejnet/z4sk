import { NextResponse } from "next/server";
import {
  checkRateLimit,
  ensureSchema,
  getDatabase,
  getRequestCountry,
  randomToken,
  recordEvent,
} from "../../../db/runtime";
import { isEncryptedInvitationEnvelope } from "../../lib/encryption-types";

export async function POST(request: Request) {
  try {
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > 20_000)
      return NextResponse.json(
        { error: "The encrypted invitation is too large." },
        { status: 413 },
      );
    const body = (await request.json()) as Record<string, unknown>;
    const encryptedInvitation = body.encryptedInvitation;
    const encryptedPayload = JSON.stringify(encryptedInvitation);
    const questionCount = Number(body.questionCount);
    const creatorTokenHash =
      typeof body.creatorTokenHash === "string"
        ? body.creatorTokenHash.trim().toLowerCase()
        : "";
    const requestedHours = Number(body.expiresInHours);
    const expiresInHours = [12, 24, 48, 72].includes(requestedHours)
      ? requestedHours
      : 12;
    if (
      !isEncryptedInvitationEnvelope(encryptedInvitation) ||
      encryptedPayload.length > 12_500 ||
      !Number.isInteger(questionCount) ||
      questionCount < 3 ||
      questionCount > 12 ||
      !/^[0-9a-f]{64}$/.test(creatorTokenHash)
    )
      return NextResponse.json(
        {
          error:
            "A valid client-encrypted invitation, access credential and question count are required.",
        },
        { status: 400 },
      );

    await ensureSchema();
    const rateLimit = await checkRateLimit(request, "create-game", 10, 10);
    if (!rateLimit.allowed)
      return NextResponse.json(
        { error: "Too many questionnaires created. Try again shortly." },
        {
          status: 429,
          headers: { "retry-after": String(rateLimit.retryAfterSeconds) },
        },
      );
    const db = getDatabase();
    const id = randomToken(16);
    const createdAt = new Date();
    const expiresAt = new Date(
      createdAt.getTime() + expiresInHours * 60 * 60 * 1000,
    );
    const viewOnce = body.viewOnce === true ? 1 : 0;
    await db
      .prepare(
        `INSERT INTO games (id, creator_token_hash, creator_email, creator_name, recipient_name, title, level, locale, library_version, questions_json, encryption_public_key, encrypted_invitation, question_count, premium, view_once, timed_mode, pack_slug, closed, created_at, expires_at) VALUES (?, ?, '', '', '', '', 'encrypted', 'encrypted', 'e2ee.2', '[]', '', ?, ?, 0, ?, 0, 'encrypted', 0, ?, ?)`,
      )
      .bind(
        id,
        creatorTokenHash,
        encryptedPayload,
        questionCount,
        viewOnce,
        createdAt.toISOString(),
        expiresAt.toISOString(),
      )
      .run();
    const country = getRequestCountry(request);
    await recordEvent({
      eventType: "created",
      gameId: id,
      locale: "encrypted",
      level: "encrypted",
      country,
      packSlug: "encrypted",
      source: body.source === "sdk" ? "sdk" : "web",
      libraryVersion: "e2ee.2",
    });
    const origin = new URL(request.url).origin;
    return NextResponse.json(
      { id, playUrl: `${origin}/g/${id}` },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("create-game", error);
    return NextResponse.json(
      { error: "No se pudo crear. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
