# @pasalo/viral-quiz-sdk

Reusable “Viral Quiz as a Service” client. It lets a partner create Pásalo links through the API or embed the creator inside another website without copying the private-answer engine.

```ts
import { PasaloClient } from "@pasalo/viral-quiz-sdk";

const pasalo = new PasaloClient("https://your-pasalo-domain.com");
const quiz = await pasalo.createQuiz({
  creatorName: "Alex",
  recipientName: "Taylor",
  locale: "en",
  level: "coqueto",
  questions: ["Would you go on a date with me?", "What caught your eye?", "What should we do together?"],
  doubleBlind: true,
  creatorInterest: true,
  expiresInHours: 12,
});

pasalo.mount(document.querySelector("#pasalo-widget")!);
```

The creator’s `adminUrl` is a bearer secret and must never be logged, indexed, or sent to analytics providers.
