import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs}"],
        plugins: {
            js
        },
        extends: ["js/recommended"],
        languageOptions: {
            globals: globals.browser
        },
        rules: {
            semi: ["error", "always"],
            indent: ["error", 4],
            "padded-blocks": ["error", "always"],
            "no-useless-escape": "off",
            "object-curly-spacing": ["error", "never"],
            "no-extend-native": ["error", {exceptions: ["Array"]}],
            "no-throw-literal": "off"
        }
    },
    {
        files: ["**/*.js"],
        languageOptions: {
            sourceType: "commonjs"
        }
    }
]);