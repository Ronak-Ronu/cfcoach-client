/* eslint-env node */
module.exports = {
	env: {browser: true, es2020: true},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:react-hooks/recommended",
		"plugin:storybook/recommended",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {ecmaVersion: "latest", sourceType: "module"},
	plugins: ["react-refresh"],
	rules: {
		"@typescript-eslint/no-explicit-any": "off",
		"react-refresh/only-export-components": "off",
		"no-mixed-spaces-and-tabs": "off",
	},
};
