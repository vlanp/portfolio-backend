const arrayDistinct = <T>(array: T[]) => {
  return array.filter((value, index, array) => array.indexOf(value) === index);
};

const arrayDistinctBy = <T, K>(array: T[], keySelector: (item: T) => K) => {
  const seen = new Set<K>();
  return array.filter((item) => {
    const key = keySelector(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

function isStringArray(arr: unknown[]): arr is string[] {
  return arr.length > 0 && typeof arr[0] === "string";
}

const isMap = (value: unknown): value is Map<unknown, unknown> => {
  return value instanceof Map;
};

const mapToRecord = <K extends string, V>(map: Map<K, V>): Record<K, V> => {
  return Object.fromEntries(map.entries()) as Record<K, V>;
};

const recordToMap = <K extends string, V>(record: Record<K, V>): Map<K, V> => {
  return new Map(Object.entries(record)) as Map<K, V>;
};

const getOrThrow = <K extends string, V>(map: Map<K, V>, key: K) => {
  const value = map.get(key);
  if (!value) {
    throw new Error(
      `No value where found for key ${key} in map ${JSON.stringify(
        map,
        undefined,
        2
      )}`
    );
  }
  return value;
};

const transformRecordAsync = async <K extends string, V, R>(
  record: Record<K, V>,
  transform: (value: V) => Promise<R>
): Promise<Record<K, R>> => {
  const entries = await Promise.all(
    Object.entries(record).map(
      async ([key, value]) => [key, await transform(value as V)] as const
    )
  );
  return Object.fromEntries(entries) as Record<K, R>;
};

export {
  arrayDistinct,
  arrayDistinctBy,
  isStringArray,
  isMap,
  mapToRecord,
  getOrThrow,
  recordToMap,
  transformRecordAsync,
};
