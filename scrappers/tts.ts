import * as tts from "google-tts-api";
import { detect } from "tinyld";
import axios from "axios";
import { load } from "cheerio";
import fs from "fs";

export const getTTS = async (text: string): Promise<string> => {
  let lang = detect(text);
  let supported = [
    "af",
    "sq",
    "am",
    "ar",
    "hy",
    "az",
    "eu",
    "bn",
    "bs",
    "bg",
    "my",
    "ca",
    "yue",
    "zh",
    "hr",
    "cs",
    "da",
    "nl",
    "en",
    "et",
    "fil",
    "fi",
    "fr",
    "gl",
    "ka",
    "de_at",
    "de",
    "el",
    "gu",
    "iw",
    "hi",
    "hu",
    "is",
    "id",
    "it",
    "ja",
    "jv",
    "kn",
    "kk",
    "km",
    "ko",
    "lo",
    "lv",
    "lt",
    "mk",
    "ms",
    "ml",
    "mr",
    "mn",
    "ne",
    "no",
    "pl",
    "pt",
    "pa",
    "ro",
    "ru",
    "rw",
    "sr",
    "si",
    "sk",
    "sl",
    "ss",
    "st",
    "es",
    "su",
    "sw",
    "sv",
    "ta",
    "te",
    "th",
    "tn",
    "tr",
    "ts",
    "uk",
    "ur",
    "uz",
    "ve",
    "vi",
    "xh",
    "zu",
  ];
  let base64: string | null = null;

  switch (text.length > 200) {
    case true:
      let base64s = await tts.getAllAudioBase64(text, {
        lang: supported.includes(lang) ? lang : undefined,
        slow: false,
      });
      let buffers = base64s.map(({ base64 }) => Buffer.from(base64, "base64"));
      // Add 'as any' to the argument passed to Buffer.concat
      let buffer = Buffer.concat(buffers as any); // <--- MODIFIED LINE
      base64 = buffer.toString("base64");
      break;
    case false:
      base64 = await tts.getAudioBase64(text, {
        lang: supported.includes(lang) ? lang : undefined,
        slow: false,
        timeout: 10000,
      });
  }

  // Ensure we always return a string, even if null was possible before.
  // Return an empty string if base64 is null to satisfy the Promise<string> return type.
  return base64 || ""; // <--- MODIFIED LINE (added || "" for safety)
};
