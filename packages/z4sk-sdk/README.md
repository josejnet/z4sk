# @z4sk/viral-quiz-sdk

Reusable “Viral Quiz as a Service” client. It lets a partner create Z4SK links through the API or embed the creator inside another website without copying the private-answer engine.

```ts
import { Z4skClient } from "@z4sk/viral-quiz-sdk";

const z4sk = new Z4skClient("https://your-z4sk-domain.com");
const quiz = await z4sk.createQuiz({
  creatorName: "Alex",
  creatorEmail: "alex@example.com",
  recipientName: "Taylor",
  locale: "en",
  level: "coqueto",
  questions: ["Would you go on a date with me?", "What caught your eye?", "What should we do together?"],
  doubleBlind: true,
  creatorInterest: true,
  expiresInHours: 12,
});

z4sk.mount(document.querySelector("#z4sk-widget")!);
```

The creator’s `adminUrl` is a bearer secret and must never be logged, indexed, or sent to analytics providers.
