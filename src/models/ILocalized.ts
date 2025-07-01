import { z } from "zod/v4";

const langs = ["en", "fr"] as const;

const ZELangs = z.enum(langs);

type ILang = (typeof langs)[number];

type ILocalized = {
  [l in ILang]: string;
};

const localizationValidator = (value: Map<string, string>): boolean => {
  const langs = Array.from(value.keys());
  const langsParseResult = langs.map((lang) => ZELangs.safeParse(lang));
  return langsParseResult.every((langParseResult) => langParseResult.success);
};

export type { ILang, ILocalized };
export { langs, ZELangs, localizationValidator };
