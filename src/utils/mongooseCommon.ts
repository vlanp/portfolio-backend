const createRecordSchema = <K extends string, T>(
  options: K[],
  get?: (data: string) => T,
  set?: (data: T) => string
) => {
  const recordSchema = {} as Record<
    K,
    {
      type: StringConstructor;
      required: true;
      get?: (data: string) => T;
      set?: (data: T) => string;
    }
  >;

  options.forEach((v) => {
    recordSchema[v] = {
      type: String,
      required: true,
    };
    if (get) {
      recordSchema[v]["get"] = get;
    }
    if (set) {
      recordSchema[v]["set"] = set;
    }
  });

  return recordSchema;
};

export { createRecordSchema };
