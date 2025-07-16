const createRecordSchema = <K extends string>(options: K[]) => {
  const recordSchema = {} as Record<
    K,
    {
      type: StringConstructor;
      required: true;
    }
  >;

  options.forEach((v) => {
    recordSchema[v] = {
      type: String,
      required: true,
    };
  });

  return recordSchema;
};

export { createRecordSchema };
