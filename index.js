import inquirer from "inquirer";
import fs from "fs";
import chalk from "chalk";
import { generateProject } from "./init.js";
import { slugify, generateOptions, dirExists } from "./utils.js";

async function run() {
    console.log(chalk.green("\n👋  Welcome to", chalk.underline.bold("Create Eleventy App") + "!"));
    console.log(`\n✨ To get started, please answer the following questions (you can always change these settings later).\n🙋 If you are unsure about any of the questions, you can press ${chalk.bold("Enter")} to accept the default value (${chalk.italic("recommended for first-time users")}).\n`);

    const project = await inquirer.prompt({
        type: "input",
        name: "name",
        message: "What is your project named?",
        default: "my-project",
        validate: (input) => {
            if (dirExists(input)) { // Check if the directory already exists or if it is empty
                return "A directory with that name already exists.";
            }
            if (input.trim() === "") {
                return "Please enter a project name.";
            }
            return true;
        },
    });

    const frameworkConfiguration = await inquirer.prompt({
        type: "list",
        name: "answer",
        message: "Would you like to add a framework?",
        choices: [
            "None",
            "Sass",
            "Tailwind",
            "Tailwind + Sass",
        ],
        default: "None",
    });

    const customOrStarter = await inquirer.prompt({
        type: "confirm",
        name: "answer",
        message: "Would you like to use a starter bundle?",
        default: true,
    });

    let bundles;
    let customizations;
    if (customOrStarter.answer) {
        bundles = await inquirer.prompt({
            type: "checkbox",
            name: "selected",
            message: "What bundles would you like to use?",
            choices: generateOptions("./lib/addons/bundles/") // Generate a list of bundles based on the files in the bundles directory
        });
        customizations = { filters: [], shortcodes: [], collections: [], eleventyPlugins: [], markdownPlugins: [], pages: [] };
    } else {
        bundles = { selected: [] };
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
            {
                type: "checkbox",
                name: "pages",
                message: "What page templates would you like to add?",
                choices: generateOptions("./lib/files/pages/"),
            }
        ]);
    }

    const advancedOrDefaults = await inquirer.prompt({
        type: "confirm",
        name: "answer",
        message: "Configure advanced properties?",
        default: false,
    });

    let properties = {};
    if (advancedOrDefaults.answer) {  
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
    } else {
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
        framework: frameworkConfiguration.answer,
        bundles: bundles.selected,
        filters: customizations.filters,
        shortcodes: customizations.shortcodes,
        collections: customizations.collections,
        eleventyPlugins: customizations.eleventyPlugins,
        markdownPlugins: customizations.markdownPlugins,
        pages: customizations.pages,
        properties: properties
    };
    generateProject(answers);
};

run();
