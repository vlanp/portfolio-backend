import z from "zod/v4";
const repoTypes = {
    FRONTEND: "Front-End",
    BACKEND: "Back-End",
};
const ZERepoTypes = z.enum(repoTypes);
export { ZERepoTypes };
