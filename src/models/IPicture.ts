import mongoose, { HydratedDocument, Model, Types } from "mongoose";
import { z } from "zod/v4";

const ZEPicturesNames = z.enum(["mainPicture"]);

type IPictureName = z.infer<typeof ZEPicturesNames>;

const ZPicture = z.strictObject({
  name: ZEPicturesNames,
  originalWidth: z.coerce.number(),
  originalHeight: z.coerce.number(),
  url: z.url({
    protocol: /^https?$/,
    hostname: z.regexes.hostname,
  }),
});

type IPicture = z.infer<typeof ZPicture>;

const ZPictureNoUrl = ZPicture.omit({ url: true });

type IPictureNoUrl = z.infer<typeof ZPictureNoUrl>;

const ZDbPicture = z.strictObject({
  ...ZPicture.shape,
  _id: z.instanceof(Types.ObjectId),
  createdAt: z.instanceof(Date),
  updatedAt: z.instanceof(Date),
  __v: z.number(),
});

type IDbPicture = z.infer<typeof ZDbPicture>;

type IHydratedPictureDocument = HydratedDocument<IDbPicture>;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type IPictureModel = Model<IDbPicture, {}, {}, {}, IHydratedPictureDocument>;

const PictureSchema = new mongoose.Schema<IPicture, IPictureModel>(
  {
    name: {
      type: String,
      enum: ZEPicturesNames.options,
      required: true,
    },
    originalWidth: {
      type: Number,
      required: true,
    },
    originalHeight: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    _id: true,
  }
);

const Picture = mongoose.model<IPicture, IPictureModel>(
  "Picture",
  PictureSchema
);

export {
  ZEPicturesNames,
  ZPicture,
  ZDbPicture,
  PictureSchema,
  Picture,
  ZPictureNoUrl,
};
export type { IPictureName, IPicture, IDbPicture, IPictureNoUrl };
