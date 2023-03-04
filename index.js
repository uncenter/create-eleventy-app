import inquirer from "inquirer";
import fs from "fs";
import { generateProject } from "./init.js";
import { slugify, generateOptions } from "./utils.js";

async function createSite() {
    const project = await inquirer.prompt({
        type: "input",
        name: "name",
        message: "What is your project named?",
        default: "my-project",
        validate: (input) => {
            if (fs.existsSync(slugify(input))) {
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
        message: "What framework configuration would you like to use?",
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
        default: false,
    });

    let bundles;
    if (customOrStarter.answer) {
        bundles = await inquirer.prompt({
            type: "checkbox",
            name: "bundles",
            message: "What packs would you like to use?",
            choices: [
                { name: "Blog Tools" },
                { name: "Comments" },
                { name: "Date Tools" },
            ],
        });
    } else {
        bundles = await inquirer.prompt([
            {
                type: "checkbox",
                name: "filters",
                message: "What filters would you like to use?",
                choices: [
                    { name: "readingTime" },
                    { name: "readableDate" },
                ],
            },
            {
                type: "checkbox",
                name: "shortcodes",
                message: "What shortcodes would you like to use?",
                choices: [
                    { name: "note" },
                    { name: "image" },
                ],
            },
            {
                type: "checkbox",
                name: "collections",
                message: "What collections would you like to use?",
                choices: [
                    { name: "posts" },
                ],
            },
            {
                type: "checkbox",
                name: "transforms",
                message: "What transforms would you like to use?",
                choices: [
                    { name: "Minify (production only)" },
                    { name: "Prettify (production only)" },
                ],
            },
        ]);
    }

    const eleventyPlugins = await inquirer.prompt({
        type: "checkbox",
        name: "selected",
        message: "What plugins would you like to use?",
        choices: generateOptions("./lib/src/plugins/eleventy.json"),
    });

    const markdownPlugins = await inquirer.prompt({
        type: "checkbox",
        name: "selected",
        message: "What Markdown plugins would you like to use?",
        choices: generateOptions("./lib/src/plugins/markdown.json"),
    });

    const pages = await inquirer.prompt({
        type: "checkbox",
        name: "selected",
        message: "What pages would you like to add?",
        choices: [
            { name: "Blog", checked: true },
            { name: "Tags" },
        ],
    });

    const advancedOrDefaults = await inquirer.prompt({
        type: "confirm",
        name: "answer",
        message: "Advanced configuration?",
    });

    let properties = {};
    if (advancedOrDefaults.answer) {  
        properties = await inquirer.prompt([
            {
                type: "list",
                name: "configFile",
                message: "Rename Eleventy config file?",
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
        bundles: bundles.bundles,
        filters: bundles.filters,
        shortcodes: bundles.shortcodes,
        collections: bundles.collections,
        eleventyPlugins: eleventyPlugins.selected,
        markdownPlugins: markdownPlugins.selected,
        pages: pages.selected,
        properties: properties
    };
    generateProject(answers);
};

createSite();
