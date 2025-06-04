import { IPlaformOut } from "./IPlatform";
import { IProgrammingLanguageOut } from "./IProgrammingLanguage";

interface IProjectsFilters {
  programmingLanguages: IProgrammingLanguageOut["name"][];
  frameworks: string[];
  platforms: IPlaformOut["name"][];
}

export default IProjectsFilters;
