import { ILang } from "../models/ILocalized";

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
  type: IFieldType;
}

interface IDocumentFieldConfig extends IBaseFieldConfig {
  type: "document";
  fields?: Record<string, IFieldConfig>;
}

interface IObjectFieldConfig extends IBaseFieldConfig {
  type: "object";
  fields?: Record<string, IFieldConfig>;
}

type IFieldConfig =
  | IBaseFieldConfig
  | IDocumentFieldConfig
  | IObjectFieldConfig;

interface ITypedSearchIndex<
  T extends Record<string, IFieldConfig> = Record<string, IFieldConfig>
> {
  name?: string;
  definition: {
    mappings: {
      dynamic?: boolean;
      fields: T;
    };
  };
  type?: "search" | "vectorSearch";
}

type IIsLocalizedFields<T> = T extends Record<string, IFieldConfig>
  ? ILang extends keyof T
    ? true
    : false
  : false;

type IExtractPathsRecursive<
  T extends Record<string, IFieldConfig>,
  TargetType extends IFieldType,
  Lang extends ILang | "all" = "all",
  Prefix extends string = ""
> = {
  [K in keyof T]: T[K] extends { type: TargetType }
    ? Prefix extends ""
      ? K
      : `${Prefix}.${string & K}`
    : T[K] extends { type: "document" | "object"; fields: infer F }
    ? F extends Record<string, IFieldConfig>
      ? IIsLocalizedFields<F> extends true
        ? Lang extends "all"
          ? IExtractPathsRecursive<
              F,
              TargetType,
              Lang,
              Prefix extends "" ? string & K : `${Prefix}.${string & K}`
            >
          : Lang extends keyof F
          ? F[Lang] extends { type: TargetType }
            ? Prefix extends ""
              ? `${string & K}.${string & Lang}`
              : `${Prefix}.${string & K}.${string & Lang}`
            : F[Lang] extends {
                type: "document" | "object";
                fields: infer SubF;
              }
            ? SubF extends Record<string, IFieldConfig>
              ? IExtractPathsRecursive<
                  SubF,
                  TargetType,
                  Lang,
                  Prefix extends ""
                    ? `${string & K}.${string & Lang}`
                    : `${Prefix}.${string & K}.${string & Lang}`
                >
              : never
            : never
          : never
        : IExtractPathsRecursive<
            F,
            TargetType,
            Lang,
            Prefix extends "" ? string & K : `${Prefix}.${string & K}`
          >
      : never
    : never;
}[keyof T];

type IExtractPaths<
  T extends Record<string, IFieldConfig>,
  TargetType extends IFieldType,
  Lang extends ILang | "all" = "all"
> = IExtractPathsRecursive<T, TargetType, Lang> extends string
  ? IExtractPathsRecursive<T, TargetType, Lang>
  : never;

type IPathToKey<T extends string> = Uppercase<
  T extends `${infer A}.${infer B}` ? `${A}_${IPathToKey<B>}` : T
>;

type IPathsObject<
  T extends Record<string, IFieldConfig>,
  TargetType extends IFieldType,
  Lang extends ILang | "all" = "all"
> = {
  [K in IExtractPaths<T, TargetType, Lang> as IPathToKey<K>]: K;
};

function extractSearchPaths<
  T extends Record<string, IFieldConfig>,
  TargetType extends IFieldType = "autocomplete",
  Lang extends ILang | "all" = "all"
>(
  searchIndex: ITypedSearchIndex<T>,
  filterType: TargetType = "autocomplete" as TargetType,
  language?: Lang
): IPathsObject<T, TargetType, Lang> {
  const paths: Record<string, string> = {};

  if (!searchIndex.definition?.mappings?.fields) {
    return paths as IPathsObject<T, TargetType, Lang>;
  }

  function isLocalizedFields(fields: Record<string, IFieldConfig>): boolean {
    const langKeys: ILang[] = ["en", "fr"];
    return langKeys.every((lang) => lang in fields);
  }

  function traverseFields(
    fields: Record<string, IFieldConfig>,
    currentPath: string = ""
  ): void {
    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
      const fullPath = currentPath ? `${currentPath}.${fieldName}` : fieldName;

      if (fieldConfig.type === filterType) {
        if (language && language !== "all") {
          const pathParts = fullPath.split(".");
          const lastPart = pathParts[pathParts.length - 1];

          if (lastPart === language || language === "all") {
            const key = fullPath.toUpperCase().replace(/\./g, "_");
            paths[key] = fullPath;
          }
        } else {
          const key = fullPath.toUpperCase().replace(/\./g, "_");
          paths[key] = fullPath;
        }
      }

      if (
        (fieldConfig.type === "document" || fieldConfig.type === "object") &&
        "fields" in fieldConfig &&
        fieldConfig.fields
      ) {
        if (
          language &&
          language !== "all" &&
          isLocalizedFields(fieldConfig.fields)
        ) {
          if (language in fieldConfig.fields) {
            const langField = fieldConfig.fields[language];
            const langPath = `${fullPath}.${language}`;

            if (langField.type === filterType) {
              const key = langPath.toUpperCase().replace(/\./g, "_");
              paths[key] = langPath;
            }

            if (
              (langField.type === "document" || langField.type === "object") &&
              "fields" in langField &&
              langField.fields
            ) {
              traverseFields(langField.fields, langPath);
            }
          }
        } else {
          traverseFields(fieldConfig.fields, fullPath);
        }
      }
    }
  }

  traverseFields(searchIndex.definition.mappings.fields);

  return paths as IPathsObject<T, TargetType, Lang>;
}

function extractSearchPathsArray<
  T extends Record<string, IFieldConfig>,
  TargetType extends IFieldType = "autocomplete",
  Lang extends ILang | "all" = "all"
>(
  searchIndex: ITypedSearchIndex<T>,
  filterType: TargetType = "autocomplete" as TargetType,
  language?: Lang
): IExtractPaths<T, TargetType, Lang>[] {
  const pathsObject = extractSearchPaths(searchIndex, filterType, language);
  return Object.values(pathsObject) as IExtractPaths<T, TargetType, Lang>[];
}

export { extractSearchPaths, extractSearchPathsArray };
export type {
  IBaseFieldConfig,
  IDocumentFieldConfig,
  IExtractPaths,
  IExtractPathsRecursive,
  IFieldConfig,
  IFieldType,
  IIsLocalizedFields,
  IObjectFieldConfig,
  IPathToKey,
  IPathsObject,
  ITypedSearchIndex,
};
