import type { Locale } from "./i18n";

type TooLateCopy = { title: string; questions: string; answers: string };

export const TOO_LATE_COPY: Record<Locale, TooLateCopy> = {
  en: { title: "Too late this time…", questions: "These questions are no longer available. The invitation may have been cancelled, answered or expired.", answers: "These answers are no longer available. They may have been cancelled, viewed once or expired." },
  es: { title: "Demasiado tarde esta vez…", questions: "Estas preguntas ya no están disponibles. Puede que la invitación se haya anulado, respondido o caducado.", answers: "Estas respuestas ya no están disponibles. Puede que se hayan anulado, visto una vez o caducado." },
  it: { title: "Troppo tardi questa volta…", questions: "Queste domande non sono più disponibili. L’invito potrebbe essere stato annullato, completato o scaduto.", answers: "Queste risposte non sono più disponibili. Potrebbero essere state annullate, visualizzate una volta o scadute." },
  fr: { title: "Trop tard cette fois…", questions: "Ces questions ne sont plus disponibles. L’invitation a peut-être été annulée, complétée ou a expiré.", answers: "Ces réponses ne sont plus disponibles. Elles ont peut-être été annulées, consultées une fois ou ont expiré." },
  de: { title: "Diesmal leider zu spät…", questions: "Diese Fragen sind nicht mehr verfügbar. Die Einladung wurde möglicherweise widerrufen, beantwortet oder ist abgelaufen.", answers: "Diese Antworten sind nicht mehr verfügbar. Sie wurden möglicherweise widerrufen, einmal angesehen oder sind abgelaufen." },
  nl: { title: "Deze keer te laat…", questions: "Deze vragen zijn niet meer beschikbaar. De uitnodiging is mogelijk ingetrokken, beantwoord of verlopen.", answers: "Deze antwoorden zijn niet meer beschikbaar. Ze zijn mogelijk ingetrokken, eenmalig bekeken of verlopen." },
  eo: { title: "Tro malfrue ĉi-foje…", questions: "Ĉi tiuj demandoj ne plu disponeblas. La invito eble estis nuligita, respondita aŭ eksvalidiĝis.", answers: "Ĉi tiuj respondoj ne plu disponeblas. Ili eble estis nuligitaj, unufoje viditaj aŭ eksvalidiĝis." },
  pt: { title: "Demasiado tarde desta vez…", questions: "Estas perguntas já não estão disponíveis. O convite pode ter sido anulado, respondido ou expirado.", answers: "Estas respostas já não estão disponíveis. Podem ter sido anuladas, vistas uma vez ou expirado." },
  zh: { title: "这次来晚了…", questions: "这些问题已不可用。邀请可能已被撤销、回答或过期。", answers: "这些回答已不可用。它们可能已被撤回、查看一次或过期。" },
  hi: { title: "इस बार बहुत देर हो गई…", questions: "ये सवाल अब उपलब्ध नहीं हैं। निमंत्रण रद्द हो चुका है, उसका जवाब दिया जा चुका है या वह समाप्त हो गया है।", answers: "ये जवाब अब उपलब्ध नहीं हैं। वे रद्द हो चुके हैं, एक बार देखे जा चुके हैं या समाप्त हो गए हैं।" },
  ja: { title: "今回は間に合いませんでした…", questions: "この質問はもう表示できません。招待が取り消された、回答済み、または期限切れの可能性があります。", answers: "この回答はもう表示できません。取り消された、一度表示された、または期限切れの可能性があります。" },
  tr: { title: "Bu kez çok geç…", questions: "Bu sorular artık kullanılamıyor. Davet iptal edilmiş, yanıtlanmış veya süresi dolmuş olabilir.", answers: "Bu yanıtlar artık kullanılamıyor. İptal edilmiş, bir kez görüntülenmiş veya süresi dolmuş olabilir." },
  machine: { title: "TOO_LATE_THIS_TIME", questions: "questions.available=false; reason=cancelled|answered|expired", answers: "answers.available=false; reason=cancelled|viewed_once|expired" },
};
