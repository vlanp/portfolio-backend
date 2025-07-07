import { z } from "zod/v4";
import { IOriginalCase } from "./IOriginalCase";
import mongoose, { HydratedDocument, Model, Types } from "mongoose";
import { localizationValidator, ZELangs } from "./ILocalized.js";

const ZEArticlesCategories = z.enum([
  "TypeScript",
  "Kotlin",
  "Python",
  "Mongoose",
  "Node.js",
  "JavaScript",
]);

type IArticleCategory = z.infer<typeof ZEArticlesCategories>;

type IArticlesCategoriesMapping = {
  [k in Uppercase<IArticleCategory>]: {
    name: IOriginalCase<IArticleCategory, k>;
    parentCategory?: keyof IArticlesCategoriesMapping;
  };
};

const articlesCategoriesMapping = {
  TYPESCRIPT: {
    name: "TypeScript",
    parentCategory: "JAVASCRIPT",
  },
  JAVASCRIPT: {
    name: "JavaScript",
  },
  KOTLIN: {
    name: "Kotlin",
  },
  MONGOOSE: {
    name: "Mongoose",
    parentCategory: "JAVASCRIPT",
  },
  "NODE.JS": {
    name: "Node.js",
    parentCategory: "JAVASCRIPT",
  },
  PYTHON: {
    name: "Python",
  },
} as const satisfies IArticlesCategoriesMapping;

const getOrderedParentCategories = (articleCategory: IArticleCategory) => {
  const orderedParentCategories: (keyof typeof articlesCategoriesMapping)[] =
    [];
  const mappedArticleCategory =
    articlesCategoriesMapping[
      articleCategory.toUpperCase() as Uppercase<IArticleCategory>
    ];
  if ("parentCategory" in mappedArticleCategory) {
    orderedParentCategories.push(mappedArticleCategory.parentCategory);
    let i = 0;
    while (orderedParentCategories[i] !== undefined) {
      const mappedArticleCategory =
        articlesCategoriesMapping[
          orderedParentCategories[
            i
          ].toUpperCase() as Uppercase<IArticleCategory>
        ];
      if ("parentCategory" in mappedArticleCategory) {
        orderedParentCategories.push(mappedArticleCategory.parentCategory);
      }
      i += 1;
    }
  }
  return orderedParentCategories;
};

const ZArticle = z.object({
  title: z.record(ZELangs, z.string()),
  description: z.record(ZELangs, z.string()),
  mdContents: z.record(ZELangs, z.string()),
  category: ZEArticlesCategories,
});

type IArticle = z.infer<typeof ZArticle>;

const ZArticleNoMd = ZArticle.omit({ mdContents: true });

type IArticleNoMd = z.infer<typeof ZArticleNoMd>;

const ZPartialArticle = ZArticle.partial();

type IPartialArticle = z.infer<typeof ZPartialArticle>;

const ZDbArticle = z.object({
  ...ZArticle.shape,
  _id: z.instanceof(Types.ObjectId),
  createdAt: z.instanceof(Date),
  updatedAt: z.instanceof(Date),
  __v: z.number(),
});

type IDbArticle = z.infer<typeof ZDbArticle>;

const ZDbArticleNoMd = ZDbArticle.omit({ mdContents: true });

type IDbArticleNoMd = z.infer<typeof ZDbArticleNoMd>;

type IHydratedArticleDocument = HydratedDocument<IDbArticle>;

type IArticleModel = Model<
  IDbArticle,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  {},
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  {},
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  {},
  IHydratedArticleDocument
>;

const ArticleSchema = new mongoose.Schema<IArticle, IArticleModel>(
  {
    title: {
      type: Map,
      of: String,
      required: true,
      validate: {
        validator: localizationValidator,
        message: `Title must contain following keys : ${ZELangs.options}`,
      },
    },
    description: {
      type: Map,
      of: String,
      required: true,
      validate: {
        validator: localizationValidator,
        message: `Description must contain following keys : ${ZELangs.options}`,
      },
    },
    mdContents: {
      type: Map,
      of: String,
      required: true,
      validate: {
        validator: localizationValidator,
        message: `mdContent must contain following keys : ${ZELangs.options}`,
      },
    },
    category: {
      type: String,
      enum: ZEArticlesCategories.options,
      required: true,
    },
  },
  {
    timestamps: true,
    _id: true,
  }
);

const Article = mongoose.model<IArticle, IArticleModel>(
  "Article",
  ArticleSchema
);

export {
  ZEArticlesCategories,
  getOrderedParentCategories,
  articlesCategoriesMapping,
  ZArticle,
  ZDbArticle,
  ArticleSchema,
  Article,
  ZArticleNoMd,
  ZPartialArticle,
  ZDbArticleNoMd,
};
export type {
  IArticleCategory,
  IArticlesCategoriesMapping,
  IArticle,
  IDbArticle,
  IHydratedArticleDocument,
  IArticleModel,
  IArticleNoMd,
  IPartialArticle,
  IDbArticleNoMd,
};
