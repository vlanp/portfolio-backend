import { Aggregate, Model, PipelineStage, Types } from "mongoose";

interface IDocumentWithHighlights<T extends object, Paths extends string[]> {
  _id: Types.ObjectId;
  document: T;
  highlights: Array<{
    score: number;
    path: Paths[number];
    texts: Array<{ value: string; type: "hit" | "text" }>;
  }>;
}

const isDocumentWithHighlights = (
  obj: unknown
): obj is IDocumentWithHighlights<object, string[]> => {
  if (
    obj &&
    typeof obj === "object" &&
    Object.keys(obj).length === 3 &&
    "_id" in obj &&
    "document" in obj &&
    "highlights" in obj
  ) {
    return true;
  }
  return false;
};

type IDocumentsHighlights<Paths extends string[]> = Omit<
  IDocumentWithHighlights<object, Paths>,
  "document"
>;

interface IDocumentsWithHighlights<T extends object, Paths extends string[]> {
  documents: T[];
  documentsHighlights: IDocumentsHighlights<Paths>[];
}

function searchDbWithIndex<T extends object, Paths extends string[]>(
  searchTerm: string,
  Model: Model<T>,
  indexName: string,
  paths: Paths,
  limit?: number
): Aggregate<IDocumentWithHighlights<T, Paths>[]> {
  const tokens = searchTerm.trim().split(/\s+/);

  const createPipeline = (searchStage: PipelineStage) => {
    const pipeline = [searchStage];
    if (limit && limit > 0) {
      pipeline.push({ $limit: limit });
    }
    pipeline.push({
      $project: {
        document: "$$ROOT",
        highlights: { $meta: "searchHighlights" },
      },
    });
    // console.log(JSON.stringify(pipeline, undefined, 2));

    return pipeline;
  };

  if (tokens.length > 1) {
    const compoundsClauses: object[] = [];
    for (const path of paths) {
      const mustClauses = tokens.map((token) => ({
        autocomplete: {
          path: path,
          query: token,
          tokenOrder: "any",
          fuzzy: { maxEdits: 1 },
        },
      }));

      compoundsClauses.push({
        compound: {
          must: mustClauses,
        },
      });
    }

    if (compoundsClauses.length > 1) {
      return Model.aggregate<IDocumentWithHighlights<T, typeof paths>>(
        createPipeline({
          $search: {
            index: indexName,
            compound: {
              should: compoundsClauses,
              minimumShouldMatch: 1,
            },
            highlight: {
              path: paths,
            },
          },
        })
      );
    } else {
      return Model.aggregate<IDocumentWithHighlights<T, typeof paths>>(
        createPipeline({
          $search: {
            index: indexName,
            ...compoundsClauses[0],
            highlight: {
              path: paths,
            },
          },
        })
      );
    }
  }

  return Model.aggregate<IDocumentWithHighlights<T, typeof paths>>(
    createPipeline({
      $search: {
        index: indexName,
        compound: {
          should: paths.map((path) => ({
            autocomplete: {
              path: path,
              query: searchTerm,
              tokenOrder: "any",
              fuzzy: { maxEdits: 1 },
            },
          })),
          minimumShouldMatch: 1,
        },
        highlight: {
          path: paths,
        },
      },
    })
  );
}

export { searchDbWithIndex, isDocumentWithHighlights };
export type { IDocumentWithHighlights, IDocumentsWithHighlights };
