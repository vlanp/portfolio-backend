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
      recordSchema[v]["get"] = (data: string) => get(data); // Mongoose get function received more than 1 parameter, so we make sure only the first one is passed
    }
    if (set) {
      recordSchema[v]["set"] = (data: T) => set(data);
    }
  });

  return recordSchema;
};

export { createRecordSchema };
