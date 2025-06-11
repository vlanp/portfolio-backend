import { Model, PipelineStage } from "mongoose";

function searchDbWithIndex<T>(
  searchTerm: string,
  Model: Model<T>,
  indexName: string,
  paths: string[],
  limit?: number
) {
  const tokens = searchTerm.trim().split(/\s+/);

  const createPipeline = (searchStage: PipelineStage) => {
    const pipeline = [searchStage];
    if (limit && limit > 0) {
      pipeline.push({ $limit: limit });
    }
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
      return Model.aggregate(
        createPipeline({
          $search: {
            index: indexName,
            compound: {
              should: compoundsClauses,
              minimumShouldMatch: 1,
            },
          },
        })
      );
    } else {
      return Model.aggregate(
        createPipeline({
          $search: {
            index: indexName,
            compound: compoundsClauses[0],
          },
        })
      );
    }
  }

  return Model.aggregate(
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
      },
    })
  );
}

export { searchDbWithIndex };
