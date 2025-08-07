type ICheckOutFramework<T extends string = string> =
  | IReactIcon<T>
  | ICustomIcon<T>;

interface IReactIcon<T extends string = string> {
  name: T;
  iconName: string;
  color: string;
}

interface ICustomIcon<T extends string = string> {
  name: T;
  imgLink: string;
}

export default ICheckOutFramework;
