interface IDocToC {
  id: string;
  level: number;
  title: string;
  content: string;
  url: string;
  parent: IDocToC | null;
}

export default IDocToC;
