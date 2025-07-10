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
    id: string;
  };
};

const articlesCategoriesMapping = {
  TYPESCRIPT: {
    name: "TypeScript",
    parentCategory: "JAVASCRIPT",
    id: "e0e23929dc924cabd449ac035d402f84",
  },
  JAVASCRIPT: {
    name: "JavaScript",
    id: "17081c17ac5f94a3abbd8068b74f7cd2",
  },
  KOTLIN: {
    name: "Kotlin",
    id: "0959da453e937229ff208a9673a5fe5a",
  },
  MONGOOSE: {
    name: "Mongoose",
    parentCategory: "JAVASCRIPT",
    id: "adae87b41557b1037baa73dc5fe9768e",
  },
  "NODE.JS": {
    name: "Node.js",
    parentCategory: "JAVASCRIPT",
    id: "d695216722adb2e27a5756c0f1b6a958",
  },
  PYTHON: {
    name: "Python",
    id: "d695216722adb2e27a5756c0f1b6a958",
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

const getAllChildsCategories = (
  articleCategory: IArticleCategory
): IArticleCategory[] => {
  const getChildsCategories = (articleCategory: IArticleCategory) => {
    const mappedArticleCategory =
      articlesCategoriesMapping[
        articleCategory.toUpperCase() as Uppercase<IArticleCategory>
      ];
    const name = mappedArticleCategory.name;
    let childs = Object.values(articlesCategoriesMapping)
      .filter(
        (mappedArticleCategory) =>
          "parentCategory" in mappedArticleCategory &&
          mappedArticleCategory.parentCategory ===
            (name.toUpperCase() as Uppercase<IArticleCategory>)
      )
      .map((mappedArticleCategory) => mappedArticleCategory.name);

    childs = childs.flatMap((child) => {
      const childs = getChildsCategories(child);
      return childs.length > 0 ? childs : [child];
    });

    return childs;
  };
  const childs = getChildsCategories(articleCategory);
  return childs.length > 0 ? childs : [articleCategory];
};

const ZArticle = z.object({
  title: z.record(ZELangs, z.string()),
  description: z.record(ZELangs, z.string()),
  imgUrl: z.url({
    protocol: /^https?$/,
    hostname: z.regexes.hostname,
  }),
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
    imgUrl: {
      type: String,
      required: true,
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

const ZArticlesCategories = z.partialRecord(
  ZEArticlesCategories,
  z.object({
    numberOfElements: z.number(),
    id: z.string(),
    get childCategories() {
      return ZArticlesCategories;
    },
  })
);

type IArticlesCategories = z.infer<typeof ZArticlesCategories>;

const getArticlesCategories = async (): Promise<IArticlesCategories> => {
  const articles = await Article.find().lean();
  const categories: IArticlesCategories = {};

  Object.values(ZEArticlesCategories.options).forEach((category) => {
    categories[category] = {
      numberOfElements: 0,
      id: articlesCategoriesMapping[
        category.toUpperCase() as Uppercase<IArticleCategory>
      ].id,
      childCategories: {},
    };
  });

  Object.entries(articlesCategoriesMapping).forEach(([, config]) => {
    const categoryName = config.name;

    if ("parentCategory" in config) {
      const parentCategoryName =
        articlesCategoriesMapping[config.parentCategory].name;

      if (categories[parentCategoryName] && categories[categoryName]) {
        categories[parentCategoryName].childCategories[categoryName] =
          categories[categoryName];
      }
    }
  });

  articles.forEach((article) => {
    const category = article.category;

    if (categories[category]) {
      categories[category].numberOfElements += 1;
    }

    const parentCategories = getOrderedParentCategories(category);
    parentCategories.forEach((parentCategoryKey) => {
      const parentCategoryName =
        articlesCategoriesMapping[parentCategoryKey].name;
      if (categories[parentCategoryName]) {
        categories[parentCategoryName].numberOfElements += 1;
      }
    });
  });

  const cleanCategories = (
    cats: IArticlesCategories,
    root: boolean = true
  ): IArticlesCategories => {
    const cleaned: IArticlesCategories = {};

    Object.entries(cats).forEach(([key, value]) => {
      if (
        value.numberOfElements > 0 &&
        (root
          ? !(
              "parentCategory" in
              articlesCategoriesMapping[
                key.toUpperCase() as Uppercase<IArticleCategory>
              ]
            )
          : true)
      ) {
        cleaned[key as IArticleCategory] = {
          ...value,
          childCategories: cleanCategories(value.childCategories, false),
        };
      }
    });

    return cleaned;
  };

  return cleanCategories(categories);
};

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
  ZArticlesCategories,
  getArticlesCategories,
  getAllChildsCategories,
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
  IArticlesCategories,
};
