import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "express",
              importNames: ["Response"],
              message:
                "❌ Please use Typed Responses from ITypedResponse.js instead.",
            },
            {
              name: "express-serve-static-core",
              importNames: ["Response"],
              message:
                "❌ Please use Typed Responses from ITypedResponse.js instead.",
            },
          ],
        },
      ],
    },
  }
);
