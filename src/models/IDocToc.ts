import { z } from "zod/v4";

const ZDocToc = z.object({
  id: z.string(),
  level: z.number(),
  title: z.string(),
  content: z.string(),
  url: z.string(),
  get parent() {
    return ZDocToc.nullable();
  },
});

type IDocToC = z.infer<typeof ZDocToc>;

export { ZDocToc };
export default IDocToC;
