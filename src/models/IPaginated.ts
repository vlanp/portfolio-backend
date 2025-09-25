import z from "zod/v4";

const getZPaginated = <ElementType>(zElementType: z.ZodType<ElementType>) => {
  return z.object({
    elements: z.array(zElementType),
    numberOfElements: z.number(),
    totalNumberOfElements: z.number(),
    totalPages: z.number(),
  });
};

type IPaginated<ElementType> = z.infer<
  ReturnType<typeof getZPaginated<ElementType>>
>;

export { getZPaginated };
export type { IPaginated };
