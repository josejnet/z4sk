import type { Locale } from "./i18n";

export const NAME_RULE_COPY: Record<Locale, string> = {
  en: "One visible character is enough. Spaces alone do not count.",
  es: "Basta un carácter visible. Los espacios solos no cuentan.",
  it: "È sufficiente un carattere visibile. I soli spazi non contano.",
  fr: "Un caractère visible suffit. Les espaces seuls ne comptent pas.",
  de: "Ein sichtbares Zeichen genügt. Nur Leerzeichen zählen nicht.",
  nl: "Eén zichtbaar teken is voldoende. Alleen spaties tellen niet.",
  eo: "Unu videbla signo sufiĉas. Nuraj spacetoj ne validas.",
  pt: "Um caráter visível é suficiente. Apenas espaços não contam.",
  zh: "输入一个可见字符即可。仅空格无效。",
  hi: "एक दिखाई देने वाला अक्षर पर्याप्त है। केवल खाली जगह मान्य नहीं है।",
  ja: "表示可能な文字が1文字あれば入力できます。空白だけでは無効です。",
  tr: "Görünür tek bir karakter yeterlidir. Yalnızca boşluklar geçerli değildir.",
  machine: "name.min_length=1_visible_character; whitespace_only=false",
};
