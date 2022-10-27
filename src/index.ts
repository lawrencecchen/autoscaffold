import inquirer, { QuestionCollection } from "inquirer";
import fs from "node:fs";

const questions: QuestionCollection = [
	{
		name: "project_name",
		type: "input",
		message: "Project name:",
		validate(value) {
			const dir = fs.readdirSync(process.cwd());
			if (dir.includes(value)) {
				return "A project with this name already exists.";
			}
			return true;
		},
		default() {
			return "hello-world";
		},
	},

	{
		name: "framework",
		type: "list",
		message: "Framework:",
		// choices: ["Next.js", "Rakkas", "Solid Start"],
		choices: ["Rakkas"],
		default() {
			return "Rakkas";
		},
	},
	{
		name: "styling",
		type: "list",
		message: "Styling solution:",
		choices: ["UnoCSS", "Tailwind"],
		default() {
			return "UnoCSS";
		},
	},
	{
		name: "unocss_presets",
		type: "checkbox",
		when: (answers) => answers.styling === "UnoCSS",
		message: "Select UnoCSS presets:",
		choices: [
			"@unocss/reset",
			"@unocss/preset-wind",
			"@unocss/preset-icons",
			"@unocss/preset-web-fonts",
			"@unocss/preset-typography",
		],
		default() {
			return [
				"@unocss/reset",
				"@unocss/preset-wind",
				"@unocss/preset-icons",
				"@unocss/preset-web-fonts",
				"@unocss/preset-typography",
			];
		},
	},
	{
		name: "tailwind_plugins",
		type: "checkbox",
		when: (answers) => answers.styling === "Tailwind",
		message: "Select Tailwind plugins:",
		choices: [
			"@tailwindcss/typography",
			"@tailwindcss/forms",
			"@tailwindcss/line-clamp",
			"@tailwindcss/aspect-ratio",
		],
		default() {
			return [
				"@tailwindcss/typography",
				"@tailwindcss/forms",
				"@tailwindcss/line-clamp",
				"@tailwindcss/aspect-ratio",
			];
		},
	},
	{
		name: "database",
		type: "list",
		message: "Database:",
		choices: ["Postgres", "SQLite", "MySQL"],
		default() {
			return "Postgres";
		},
	},
	{
		name: "schema_migrator",
		type: "list",
		message: "Schema migrator:",
		choices: ["Prisma"],
		default() {
			return "Prisma";
		},
	},
	{
		name: "orm",
		type: "list",
		message: "SQL interface:",
		choices: ["Kysely", "Prisma"],
	},
	{
		name: "authentication",
		type: "list",
		message: "Auth:",
		choices: ["next-auth"],
	},
	{
		name: "rpc",
		type: "list",
		message: "RPC:",
		choices: ["tRPC"],
		default() {
			return "tRPC";
		},
	},
];

inquirer.prompt(questions).then((answers) => {
	console.log(JSON.stringify(answers, null, "  "));
});
