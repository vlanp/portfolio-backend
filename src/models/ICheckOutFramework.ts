type ICheckOutFramework<T extends string = string> =
  | IReactIcon<T>
  | ICustomIcon<T>;

interface IReactIcon<T extends string = string> {
  type: "ReactIcon";
  name: T;
  iconName: string;
  color: string;
}

interface ICustomIcon<T extends string = string> {
  type: "CustomIcon";
  name: T;
  imgLink: string;
  widthPx: number;
  heightPx: number;
}

export default ICheckOutFramework;
