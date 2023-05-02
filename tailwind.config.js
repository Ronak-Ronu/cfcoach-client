/* eslint-env node */
/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: "class",
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				serif: [
					'"Merriweather"',
					"Merriweather",
					"Times New Roman",
					"Georgia",
					"serif",
				],
				sans: ['"DM Sans"', "DM Sans", "Arial", "sans-serif"],
			},
		},
	},
	plugins: [],
};
