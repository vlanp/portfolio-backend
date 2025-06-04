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

export { arrayDistinct, arrayDistinctBy, isStringArray };
