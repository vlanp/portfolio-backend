import { z } from "zod/v4";
import { programmingLanguagesMapping } from "./IProgrammingLanguage.js";
import { platformsMapping } from "./IPlatform.js";
import { frameworksOut } from "./IRepo.js";

const ZAllProjectsFilters = z.object({
  programmingLanguages: z.array(
    z.object({
      name: z.literal(
        Object.values(programmingLanguagesMapping).map((it) => it.name)
      ),
      frameworks: z.array(z.literal(frameworksOut)),
    })
  ),
  platforms: z.array(
    z.literal(Object.values(platformsMapping).map((it) => it.name))
  ),
});

type IAllProjectsFilters = z.infer<typeof ZAllProjectsFilters>;

const ZSelectedProjectsFilters = z.object({
  ...ZAllProjectsFilters.shape,
  programmingLanguages: z.array(
    z.object({
      name: z.object({
        value: z.literal(
          Object.values(programmingLanguagesMapping).map((it) => it.name)
        ),
        isSelected: z.boolean(),
      }),
      frameworks: z.array(z.literal(frameworksOut)),
    })
  ),
  search: z.string().optional(),
  filtersBehavior: z.literal(["union", "intersection"]).optional(),
});

type ISelectedProjectsFilters = z.infer<typeof ZSelectedProjectsFilters>;

export { ZAllProjectsFilters, ZSelectedProjectsFilters };
export type { IAllProjectsFilters, ISelectedProjectsFilters };
