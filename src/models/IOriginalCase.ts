type IOriginalCase<O extends string, T extends Uppercase<O>> = {
  [K in O]: Uppercase<K> extends T ? K : never;
}[O];

export type { IOriginalCase };
