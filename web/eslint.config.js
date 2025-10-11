import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
	globalIgnores(["dist"]),
	{
		files: ["**/*.{js,jsx}"],
		extends: [js.configs.recommended, reactHooks.configs["recommended-latest"], reactRefresh.configs.vite],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
			parserOptions: {
				ecmaVersion: "latest",
				ecmaFeatures: { jsx: true },
				sourceType: "module",
			},
		},
		rules: {
			"no-const-assign": "warn",
			"no-this-before-super": "warn",
			"no-undef": "warn",
			"no-unreachable": "warn",
			"no-unused-vars": "off",
			"constructor-super": "warn",
			"valid-typeof": "warn",
		},
	},
]);
