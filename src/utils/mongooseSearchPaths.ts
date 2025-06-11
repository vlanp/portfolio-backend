type FieldType =
  | "autocomplete"
  | "text"
  | "string"
  | "number"
  | "date"
  | "boolean"
  | "document"
  | "object";

interface BaseFieldConfig {
  type: FieldType;
}

interface DocumentFieldConfig extends BaseFieldConfig {
  type: "document";
  fields?: Record<string, FieldConfig>;
}

interface ObjectFieldConfig extends BaseFieldConfig {
  type: "object";
  fields?: Record<string, FieldConfig>;
}

type FieldConfig = BaseFieldConfig | DocumentFieldConfig | ObjectFieldConfig;

interface TypedSearchIndex<
  T extends Record<string, FieldConfig> = Record<string, FieldConfig>
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

type ExtractPathsRecursive<
  T extends Record<string, FieldConfig>,
  TargetType extends FieldType,
  Prefix extends string = ""
> = {
  [K in keyof T]: T[K] extends { type: TargetType }
    ? Prefix extends ""
      ? K
      : `${Prefix}.${string & K}`
    : T[K] extends { type: "document" | "object"; fields: infer F }
    ? F extends Record<string, FieldConfig>
      ? ExtractPathsRecursive<
          F,
          TargetType,
          Prefix extends "" ? string & K : `${Prefix}.${string & K}`
        >
      : never
    : never;
}[keyof T];

type ExtractPaths<
  T extends Record<string, FieldConfig>,
  TargetType extends FieldType
> = ExtractPathsRecursive<T, TargetType> extends string
  ? ExtractPathsRecursive<T, TargetType>
  : never;

function extractSearchPaths<
  T extends Record<string, FieldConfig>,
  TargetType extends FieldType = "autocomplete"
>(
  searchIndex: TypedSearchIndex<T>,
  filterType: TargetType = "autocomplete" as TargetType
): ExtractPaths<T, TargetType>[] {
  const paths: string[] = [];

  if (!searchIndex.definition?.mappings?.fields) {
    return paths as ExtractPaths<T, TargetType>[];
  }

  function traverseFields(
    fields: Record<string, FieldConfig>,
    currentPath: string = ""
  ): void {
    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
      const fullPath = currentPath ? `${currentPath}.${fieldName}` : fieldName;

      if (fieldConfig.type === filterType) {
        paths.push(fullPath);
      }

      if (
        (fieldConfig.type === "document" || fieldConfig.type === "object") &&
        "fields" in fieldConfig &&
        fieldConfig.fields
      ) {
        traverseFields(fieldConfig.fields, fullPath);
      }
    }
  }

  traverseFields(searchIndex.definition.mappings.fields);

  return paths as ExtractPaths<T, TargetType>[];
}

export { extractSearchPaths };
