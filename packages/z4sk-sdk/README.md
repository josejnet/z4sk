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
  doubleBlind: true,
  matchQuestion: "Would you kiss me on our next date?",
  timedMode: true, // 30 seconds per question, with two required acknowledgements
  creatorInterest: true,
  expiresInHours: 12,
});

z4sk.mount(document.querySelector("#z4sk-widget")!);
```

The SDK generates both a random creator-access token and an ECDH P-256 key pair locally. It sends only the token's SHA-256 hash and the public ECDH key to Z4SK, pins that public key's SHA-256 fingerprint in the returned `playUrl`, and assembles the complete `adminUrl` in the browser. The complete creator URL never reaches the creation API or Neon Postgres and is the only response-decryption capability: never log, index or send it to analytics providers.
