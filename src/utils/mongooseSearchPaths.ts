import { ILang, langs } from "../models/ILocalized.js";
import { SearchIndexDescription } from "mongoose";

type IFieldType =
  | "autocomplete"
  | "text"
  | "string"
  | "number"
  | "date"
  | "boolean"
  | "document"
  | "object";

interface IBaseFieldConfig {
  type: Exclude<IFieldType, "document" | "object">;
  analyzer?: string;
}

interface IDocumentFieldConfig<T extends Record<string, unknown>> {
  type: Extract<IFieldType, "document">;
  fields: {
    [K in keyof T]?: IFieldConfig<T[K]>;
  };
}

interface IObjectFieldConfig<T extends Record<string, unknown>> {
  type: Extract<IFieldType, "object">;
  fields: {
    [K in keyof T]?: IFieldConfig<T[K]>;
  };
}

type IFieldConfig<T> = T extends Record<string, unknown>
  ? IDocumentFieldConfig<T> | IObjectFieldConfig<T>
  : IBaseFieldConfig;

interface ITypedSearchIndex<T extends Record<string, unknown>>
  extends SearchIndexDescription {
  name: string;
  definition: {
    analyzer: string;
    searchAnalyzer: string;
    mappings: {
      dynamic?: boolean;
      fields: IFields<T>;
    };
  };
  type?: "search" | "vectorSearch";
}

type IRemoveArray<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends Array<infer U>
    ? U extends Record<string, unknown>
      ? IRemoveArray<U>
      : U
    : T[K] extends Record<string, unknown>
    ? IRemoveArray<T[K]>
    : T[K];
};

type IFields<T extends Record<string, unknown>> = {
  [K in keyof T]?: IFieldConfig<IRemoveArray<T>[K]>;
};

type IIsLocalizedObject<T extends Record<string, unknown>> =
  keyof T extends ILang ? true : false;

type IFilterLocalizedFields<
  T extends Record<string, unknown>,
  Lang extends ILang
> = IIsLocalizedObject<T> extends true ? Pick<T, Lang> : T;

// Keys which are symbols are excluded
type IPathChained<
  T extends Record<string, unknown>,
  K extends IFields<T>,
  Lang extends ILang,
  ToUpperCase extends boolean,
  PathSeparator extends "_" | ".",
  Q = IRemoveArray<T>
> = {
  [H in keyof K & keyof Q]: H extends string | number
    ? Q[H] extends Record<string, unknown>
      ? K[H] extends { fields: infer NestedFields }
        ? NestedFields extends IFields<Q[H]>
          ? IFilterLocalizedFields<
              NestedFields,
              Lang
            > extends infer FilteredFields
            ? FilteredFields extends IFields<Q[H]>
              ? `${ToUpperCase extends true
                  ? Uppercase<`${H}`>
                  : `${H}`}${PathSeparator}${IPathChained<
                  Q[H],
                  FilteredFields,
                  Lang,
                  ToUpperCase,
                  PathSeparator
                >}`
              : `${ToUpperCase extends true ? Uppercase<`${H}`> : `${H}`}`
            : `${ToUpperCase extends true ? Uppercase<`${H}`> : `${H}`}`
          : `${ToUpperCase extends true ? Uppercase<`${H}`> : `${H}`}`
        : `${ToUpperCase extends true ? Uppercase<`${H}`> : `${H}`}`
      : `${ToUpperCase extends true ? Uppercase<`${H}`> : `${H}`}`
    : never;
}[keyof K & keyof Q];

type IExtractSearchPaths<
  T extends Record<string, unknown>,
  Index extends ITypedSearchIndex<T>,
  Lang extends ILang
> = Record<
  IPathChained<T, Index["definition"]["mappings"]["fields"], Lang, true, "_">,
  IPathChained<T, Index["definition"]["mappings"]["fields"], Lang, false, ".">
>;

function extractSearchPaths<
  T extends Record<string, unknown>,
  Index extends ITypedSearchIndex<T>,
  Lang extends ILang
>(index: Index, lang: Lang): IExtractSearchPaths<T, Index, Lang> {
  const result = {} as IExtractSearchPaths<T, Index, Lang>;

  function processFields<U extends Record<string, unknown>>(
    fields: IFields<U>,
    prefixUpper: string = "",
    prefixLower: string = ""
  ): void {
    for (const key in fields) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        const field = fields[key];
        const upperKey = key.toUpperCase();
        const lowerKey = key;

        const upperPath = prefixUpper ? `${prefixUpper}_${upperKey}` : upperKey;
        const lowerPath = prefixLower ? `${prefixLower}.${lowerKey}` : lowerKey;

        if (field && typeof field === "object" && "type" in field) {
          if (field.type === "document" || field.type === "object") {
            if ("fields" in field && field.fields) {
              const fieldKeys = Object.keys(field.fields);
              const isLocalized = fieldKeys.every((k) =>
                (langs as readonly string[]).includes(k)
              );

              if (isLocalized) {
                const localizedFields = {
                  [lang]: field.fields[lang],
                } as IFields<Record<string, unknown>>;
                processFields(localizedFields, upperPath, lowerPath);
              } else {
                processFields(
                  field.fields as IFields<Record<string, unknown>>,
                  upperPath,
                  lowerPath
                );
              }
            }
          } else {
            (result as Record<string, string>)[upperPath] = lowerPath;
          }
        }
      }
    }
  }

  processFields(
    index.definition.mappings.fields as IFields<Record<string, unknown>>
  );

  return result;
}

// See https://github.com/microsoft/TypeScript/issues/51680#issuecomment-1330425668

// interface MyObject extends Record<string, unknown> {
//   name: string;
//   0: string; // ← Clé numérique autorisée !
//   [Symbol.species]: string; // ← Symbol autorisé !
// }

// type IFields<
//   H extends ITypedSearchIndex<T>,
//   T extends Record<string, unknown>
// > = H["definition"]["mappings"]["fields"];

// type IChildsFields<H extends ITypedSearchIndex<T>, T extends Record<string, unknown>, Q extends IFields<H,T>> = Q extends Record<string, IFieldConfig<>>

export { extractSearchPaths };
export type {
  IBaseFieldConfig,
  IDocumentFieldConfig,
  IFieldConfig,
  IFieldType,
  IObjectFieldConfig,
  ITypedSearchIndex,
  IExtractSearchPaths,
};
