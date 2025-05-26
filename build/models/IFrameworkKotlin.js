import { z } from "zod/v4";
const ZEFrameworksKotlinIn = z.enum(["JETPACK_COMPOSE"]);
const frameworksKotlinMapping = {
    JETPACK_COMPOSE: {
        name: "Jetpack Compose",
        iconName: "SiJetpackcompose",
        color: "#4285F4",
    },
};
export { ZEFrameworksKotlinIn, frameworksKotlinMapping };
