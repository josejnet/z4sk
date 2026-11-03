# @z4sk/viral-quiz-sdk

Reusable “Viral Quiz as a Service” client. It lets a partner create Z4SK links through the API or embed the creator inside another website without copying the private-answer engine.

```ts
import { Z4skClient } from "@z4sk/viral-quiz-sdk";

const z4sk = new Z4skClient("https://your-z4sk-domain.com");
const quiz = await z4sk.createQuiz({
  creatorName: "Alex",
  recipientName: "Taylor",
  locale: "en",
  level: "coqueto",
  questions: ["Would you go on a date with me?", "What caught your eye?", "What should we do together?"],
  timedMode: true, // 15 seconds per question, with two required acknowledgements
  expiresInHours: 12,
});

z4sk.mount(document.querySelector("#z4sk-widget")!);
```

The SDK locally generates a random 256-bit invitation key, a random creator-access token and an ECDH P-256 response key pair. It encrypts display names, questions, settings and the ECDH public key with AES-256-GCM before calling Z4SK. The API receives only the invitation envelope, question count, operational policy and the token's SHA-256 hash. An optional `sharedKey` adds a second, separately shared secret; `generateSharedKey()` creates the current 128-bit format, while legacy 256-bit keys remain accepted.

The returned `playUrl` contains the invitation key in its URL fragment. The `adminUrl` contains that same key plus the bearer token and ECDH private key. URL fragments do not reach the creation API through normal navigation, and neither complete URL is written to Neon Postgres.

**Both complete URLs are bearer secrets. Sharing the invitation URL is equivalent to sharing a password:** its holder can decrypt the invitation and submit until expiry. The creator URL additionally grants dashboard access and response decryption. Never log, index, embed in analytics or expose either complete URL.

See the public [cryptographic design](../../docs/CRYPTOGRAPHY.md) and [security policy](../../SECURITY.md) for exact payloads, visible metadata and trust boundaries.
