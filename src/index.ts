import inquirer, { QuestionCollection } from "inquirer";
import fs from "node:fs";
import path from "node:path";
import degit from "degit";
import z from "zod";
import ora from "ora";

const questionsSchema = z.object({
  project_name: z.string().min(1),
  framework: z.enum(["Rakkas"]),
  styling: z.enum(["UnoCSS", "Tailwind"]),
  unocss_presets: z
    .array(
      z.enum([
        "@unocss/reset",
        "@unocss/preset-wind",
        "@unocss/preset-icons",
        "@unocss/preset-web-fonts",
        "@unocss/preset-typography",
      ])
    )
    .optional(),
  tailwind_plugins: z
    .array(
      z.enum([
        "@tailwindcss/typography",
        "@tailwindcss/forms",
        "@tailwindcss/line-clamp",
        "@tailwindcss/aspect-ratio",
      ])
    )
    .optional(),
  database: z.enum(["PostgreSQL", "MySQL", "SQLite", "MongoDB"]).optional(),
  schema_migrator: z.enum(["Prisma"]),
  orm: z.enum(["Kysely", "Prisma"]),
  auth: z.enum(["next-auth"]),
  rpc: z.enum(["tRPC"]),
});

function dirExists(path: string) {
  try {
    return fs.statSync(path).isDirectory();
  } catch (err) {
    return false;
  }
}

const questions: QuestionCollection = [
  {
    name: "project_name",
    type: "input",
    message: "Project name:",
    validate(value) {
      if (dirExists(value)) {
        return "Directory already exists";
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
    choices: ["PostgreSQL", "SQLite", "MySQL"],
    default() {
      return "PostgreSQL";
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
    name: "auth",
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

inquirer.prompt(questions).then(async (unsafe_answers) => {
  // console.log(JSON.stringify(unsafe_answers, null, "  "));
  const answers = questionsSchema.parse(unsafe_answers);

  const config = {
    user: "lawrencecchen",
    repository: "autoscaffold",
    directory: "packages/rakkas-template-pnpm",
  };

  const outdir = path.join(process.cwd(), answers.project_name);

  await new Promise((res, rej) => {
    const emitter = degit(
      `${config.user}/${config.repository}/${config.directory}`,
      {
        cache: false,
        force: true,
        verbose: true,
      }
    );
    const spinner = ora("Cloning template...");

    emitter.on("info", (info) => {
      spinner.start();
    });

    emitter.on("warn", (warn) => {
      console.warn(warn.message);
    });

    emitter.clone(outdir).then(() => {
      spinner.stop();
      res({});
    });
  });

  console.log(`Project created at ${outdir}`);
});
