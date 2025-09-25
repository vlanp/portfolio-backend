import { z } from "zod/v4";

const ZESortsIn = z.enum(["asc", "desc", "ascending", "descending", "1", "-1"]);

const ZESortsOut = ZESortsIn.transform((value) => {
  if (value === "1") {
    return 1;
  } else if (value === "-1") {
    return -1;
  } else {
    return value;
  }
});

type ISortIn = z.infer<typeof ZESortsIn>;

type ISortOut = z.infer<typeof ZESortsOut>;

export type { ISortIn, ISortOut };
export { ZESortsIn, ZESortsOut };
