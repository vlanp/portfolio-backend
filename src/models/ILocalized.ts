import { z } from "zod/v4";

const langs = ["en", "fr"] as const;

const ZELangs = z.enum(langs);

type ILang = (typeof langs)[number];

type ILocalized = {
  [l in ILang]: string;
};

export type { ILang, ILocalized };
export { langs, ZELangs };
