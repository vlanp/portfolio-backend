import { z } from "zod/v4";
const frameworksKotlin = {
    JETPACK_COMPOSE: "Jetpack Compose",
};
const ZEFrameworksKotlin = z.enum(frameworksKotlin);
export { ZEFrameworksKotlin };
