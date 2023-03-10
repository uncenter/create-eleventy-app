import inquirer from "inquirer";
import fs from "fs";
import yargs from "yargs";
import chalk from "chalk";

import { generateProject } from "./init.js";
import { toTitleCase, generateOptions, dirExists } from "./utils.js";

const __name = "create-eleventy-app";
const __version = "0.1.0";

const argv = yargs(process.argv.slice(2))
    .version(__version)
    .option("verbose", {
        alias: "v",
        describe: "Print verbose output",
        type: "boolean",
        default: false,
    })
    .option("silent", {
        alias: "s",
        describe: "Silence all output",
        type: "boolean",
        default: false,
    })
    .option("set", {
        alias: "e",
        describe: "Use a specific version of Eleventy",
        type: "string",
        default: "latest",
    })
    .option("noinstall", {
        alias: "n",
        describe: "Do not install dependencies",
        type: "boolean",
        default: false,
    })
    .argv;

if (argv.verbose && argv.silent) {
    console.error("You cannot use both --verbose and --silent.");
    process.exit(1);
}

async function run() {
    console.log(chalk.green("\n👋  Welcome to", chalk.underline.bold(toTitleCase(__name)), "v0.1.0!"));
    console.log(`\n✨ To get started, please answer the following questions (you can always change these settings later).\n🙋 If you are unsure about any of the questions, you can press ${chalk.bold("Enter")} to accept the default value (${chalk.italic("recommended for first-time users")}).\n`);

    const project = await inquirer.prompt({
        type: "input",
        name: "name",
        message: "What would you like to name your project?",
        default: "my-project",
        validate: (input) => {
            if (dirExists(input)) {
                return "A directory with that name already exists.";
            }
            if (input.trim() === "") {
                return "Please enter a project name.";
            }
            return true;
        },
    });
    const quickstart = await inquirer.prompt({
        type: "confirm",
        name: "answer",
        message: "Quickstart? (recommended for first-time users)",
        default: true,
    });

    let customizations;
    let bundles;
    let framework;
    let properties;
    if (quickstart.answer) {
        bundles = await inquirer.prompt({
            type: "checkbox",
            name: "selected",
            message: "What bundles would you like to use?",
            choices: generateOptions("./lib/addons/bundles/")
        });
    } else {
        const useBundles = await inquirer.prompt({
            type: "confirm",
            name: "answer",
            message: "Use starter bundles?",
            default: false,
        });
        if (useBundles.answer) {
            bundles = await inquirer.prompt({
                type: "checkbox",
                name: "selected",
                message: "What bundles would you like to use?",
                choices: generateOptions("./lib/addons/bundles/"),
            });
        } else {
            customizations = await inquirer.prompt([
                {
                    type: "checkbox",
                    name: "filters",
                    message: "What filters would you like to use?",
                    choices: generateOptions("./lib/addons/filters/"),
                    loop: false,
                },
                {
                    type: "checkbox",
                    name: "shortcodes",
                    message: "What shortcodes would you like to use?",
                    choices: generateOptions("./lib/addons/shortcodes/"),
                    loop: false,
                },
                {
                    type: "checkbox",
                    name: "collections",
                    message: "What collections would you like to use?",
                    choices: generateOptions("./lib/addons/collections/"),
                    loop: false,
                },
                {
                    type: "checkbox",
                    name: "eleventyPlugins",
                    message: "What plugins would you like to use?",
                    choices: generateOptions("./lib/plugins/eleventy.json"),
                },
                {
                    type: "checkbox",
                    name: "markdownPlugins",
                    message: "What Markdown plugins would you like to use?",
                    choices: generateOptions("./lib/plugins/markdown.json"),
                },
                // {
                //     type: "checkbox",
                //     name: "pages",
                //     message: "What page templates would you like to add?",
                //     choices: generateOptions("./lib/files/pages/"),
                // }
            ]);
        }
        const configureAdvanced = await inquirer.prompt({
            type: "confirm",
            name: "answer",
            message: "Configure advanced properties?",
            default: false,
        });

        let framework = {};
        if (configureAdvanced.answer) {
            // framework = await inquirer.prompt({
            //     type: "list",
            //     name: "answer",
            //     message: "Would you like to add a framework?",
            //     choices: [
            //         "None",
            //         "Sass",
            //         "Tailwind",
            //         "Tailwind + Sass",
            //     ],
            //     default: "None",
            // });
            properties = await inquirer.prompt([
                {
                    type: "list",
                    name: "configFile",
                    message: "Set Eleventy config file path?",
                    choices: ["eleventy.config.js", "eleventy.config.cjs", ".eleventy.js"],
                    default: "eleventy.config.js",
                },
                {
                    type: "input",
                    name: "output",
                    message: "Set output directory?",
                    default: "dist",
                },
                {
                    type: "input",
                    name: "input",
                    message: "Set input directory?",
                    default: "src",
                },
                {
                    type: "input",
                    name: "data",
                    message: "Set data directory?",
                    default: "_data",
                },
                {
                    type: "input",
                    name: "includes",
                    message: "Set includes directory?",
                    default: "_includes",
                },
            ]);
        }
    }
    if (customizations === undefined) {
        customizations = { filters: [], shortcodes: [], collections: [], eleventyPlugins: [], markdownPlugins: [], pages: [] };
    } else {
        customizations.pages = [];
    }
    if (bundles === undefined) {
        bundles = { selected: [] };
    }
    if (framework === undefined) {
        framework = { answer: null };
    }
    if (properties === undefined) {
        properties = {
            configFile: "eleventy.config.js",
            output: "dist",
            input: "src",
            data: "_data",
            includes: "_includes",
        };
    }


    const answers = {
        name: project.name,
        framework: framework.answer,
        bundles: bundles.selected,
        filters: customizations.filters,
        shortcodes: customizations.shortcodes,
        collections: customizations.collections,
        eleventyPlugins: customizations.eleventyPlugins,
        markdownPlugins: customizations.markdownPlugins,
        pages: customizations.pages,
        properties: properties
    };
    generateProject(answers, argv);
};

run();
