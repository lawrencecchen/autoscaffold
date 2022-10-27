import inquirer, { QuestionCollection } from "inquirer";
import fs from "node:fs/promises";
import path from "node:path";
import degit from "degit";
import z from "zod";
import ora from "ora";
import invariant from "tiny-invariant";

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

async function dirExists(path: string) {
  try {
    return (await fs.stat(path)).isDirectory();
  } catch (err) {
    return false;
  }
}
function withPackageVersion(deps: string[]) {
  const result: Record<string, string> = {};
  for (const dep of deps) {
    if (!packageVersions[dep]) {
      throw new Error(`Cannot resolve package version for  ${dep}`);
    }
    result[dep] = packageVersions[dep];
  }
  return result;
}
function sortObject(obj: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
  );
}
function prettified(input: string) {
  return;
}

const questions: QuestionCollection = [
  {
    name: "project_name",
    type: "input",
    message: "Project name:",
    async validate(value) {
      if (await dirExists(value)) {
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
    message: "CSS:",
    choices: ["UnoCSS", "Tailwind"],
    default() {
      return "UnoCSS";
    },
  },
  {
    name: "unocss_presets",
    type: "checkbox",
    when: (answers) => answers.styling === "UnoCSS",
    message: "UnoCSS presets:",
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

const packageVersions: Record<string, string> = {
  unocss: "^0.46.0",
  "@unocss/reset": "^0.46.0",
};

inquirer.prompt(questions).then(async (unsafe_answers) => {
  const answers = questionsSchema.parse(unsafe_answers);
  const config = {
    user: "lawrencecchen",
    repository: "autoscaffold",
    directory: "packages/rakkas-template",
  };

  const outdir = path.join(process.cwd(), answers.project_name);
  try {
    await new Promise((res, _rej) => {
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

    const addedDependencies: Array<string> = [];
    const addedDevDependencies: Array<string> = [];

    // file path -> file contents
    const addedFilesMap: Record<string, string> = {};
    let mutableViteConfig = await fs.readFile(
      path.join(outdir, "vite.config.ts"),
      "utf-8"
    );
    const packageJsonBaseSchema = z.object({
      name: z.string(),
      devDependencies: z.record(z.string()),
      dependencies: z.record(z.string()),
    });
    const packageJson = packageJsonBaseSchema
      .passthrough()
      .parse(
        JSON.parse(
          await fs.readFile(path.join(outdir, "package.json"), "utf-8")
        )
      );

    // unocss/vite
    if (answers.styling === "UnoCSS") {
      invariant(answers.unocss_presets);
      addedDevDependencies.push(
        "unocss",
        ...answers.unocss_presets.filter((p) => p === "@unocss/reset")
      );
      const addedImports = [`import Unocss from 'unocss/vite'`];
      let unocssOptions = null;

      if (answers.unocss_presets.length > 0) {
        const unocssPresetMap: Record<string, string> = {};
        for (const preset of answers.unocss_presets) {
          if (preset === "@unocss/reset") {
            continue;
          }
          const [_, name] = preset.split("/");
          const [first, ...rest] = name.split("-");
          const camelCaseName = [
            first,
            ...rest.map((s) => s[0].toUpperCase() + s.slice(1)),
          ].join("");
          unocssPresetMap[preset] = camelCaseName;
        }
        const unocssImport = `import { ${Object.values(unocssPresetMap).join(
          ", "
        )} } from 'unocss'`;
        addedImports.push(unocssImport);
        unocssOptions = `{
          presets: [${Object.values(unocssPresetMap)
            .map((p) => `${p}()`)
            .join(", ")}]
          }`;
      }

      mutableViteConfig = mutableViteConfig.replace(
        `\nexport default defineConfig({`,
        `${addedImports.join("\n")}\n\nexport default defineConfig({`
      );

      const pluginsRegex = /plugins: \[(.*)\]/;
      mutableViteConfig = mutableViteConfig.replace(
        pluginsRegex,
        `plugins: [Unocss(${unocssOptions || ""}), $1]`
      );

      let mutableBaseRootLayoutContents = `import React from "react";
            import "@unocss/reset/tailwind.css";
            import "uno.css";
            
            export default function Layout(props: { children: React.ReactNode }) {
              return <>{props.children}</>;
            }
            `;
      if (!answers.unocss_presets.includes("@unocss/reset")) {
        mutableBaseRootLayoutContents = mutableBaseRootLayoutContents.replace(
          `import "@unocss/reset/tailwind.css";`,
          ""
        );
      }
      addedFilesMap["src/routes/layout.tsx"] = mutableBaseRootLayoutContents;
    }

    // tailwindcss
    if (answers.styling === "Tailwind") {
      throw new Error("Tailwind not yet implemented");
    }

    // package.json
    packageJson.dependencies = sortObject({
      ...packageJson.dependencies,
      ...withPackageVersion(addedDependencies),
    });
    packageJson.devDependencies = sortObject({
      ...packageJson.devDependencies,
      ...withPackageVersion(addedDevDependencies),
    });
    packageJson.name = answers.project_name;

    async function writeFileCreateDir(
      filepath: string,
      contents: string
    ): Promise<void> {
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      return fs.writeFile(filepath, contents);
    }

    await Promise.all([
      fs.writeFile(path.join(outdir, "vite.config.ts"), mutableViteConfig),
      fs.writeFile(
        path.join(outdir, "package.json"),
        JSON.stringify(packageJson, null, "  ")
      ),
      ...Object.entries(addedFilesMap).map(([filepath, contents]) =>
        writeFileCreateDir(path.join(outdir, filepath), contents)
      ),
    ]);

    console.log(`
    
    Project created in ${outdir}
    
    To get started:
    
    cd ${answers.project_name}
    npm install
    npm run dev
    
    `);
  } catch (err) {
    console.error(err);
    await fs.rmdir(outdir, { recursive: true });
  }
});
