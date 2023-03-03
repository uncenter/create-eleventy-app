import inquirer from "inquirer";
import fs from "fs";
import { generateProject } from "./init.js";
import { slugify } from "./utils.js";

async function run() {
    const projectNameAnswer = await inquirer.prompt({
        type: "input",
        name: "projectName",
        message: "What is your project named?",
        default: "Eleventy Starter",
        validate: (input) => {
            if (fs.existsSync(slugify(input))) {
                return "A project with that name already exists.";
            }
            if (input.trim() === "") {
                return "Please enter a project name.";
            }
            return true;
        },
    });

    const configurationAnswer = await inquirer.prompt({
        type: "list",
        name: "configuration",
        message: "What configuration would you like to use?",
        choices: [
            "Base",
            "Base + Sass",
            "Base + Tailwind",
            "Base + Tailwind + Sass",
        ],
        default: "Base",
    });

    const customOrPacksAnswer = await inquirer.prompt({
        type: "list",
        name: "customOrPacks",
        message: "What configuration would you like to use?",
        choices: ["Packs", "Custom"],
    });

    let packsAnswer;
    if (customOrPacksAnswer.customOrPacks === "Packs") {
        packsAnswer = await inquirer.prompt({
            type: "checkbox",
            name: "addons",
            message: "What packs would you like to use?",
            choices: [
                { name: "Blog Tools", checked: true },
                { name: "Comments" },
                { name: "Date Tools" },
            ],
        });
    } else {
        packsAnswer = await inquirer.prompt([
            {
                type: "checkbox",
                name: "filters",
                message: "What filters would you like to use?",
                choices: [
                    { name: "readingTime", checked: true },
                    { name: "readableDate" },
                    { name: "None" },
                ],
            },
            {
                type: "checkbox",
                name: "shortcodes",
                message: "What shortcodes would you like to use?",
                choices: [
                    { name: "note", checked: true },
                    { name: "image" },
                    { name: "None" },
                ],
            },
            {
                type: "checkbox",
                name: "collections",
                message: "What collections would you like to use?",
                choices: [
                    { name: "posts", checked: true },
                ],
            },
            {
                type: "checkbox",
                name: "transforms",
                message: "What transforms would you like to use?",
                choices: [
                    { name: "minify (production only)", checked: true },
                    { name: "prettify (production only)" },
                ],
            },
        ]);
    }

    const pluginsAnswer = await inquirer.prompt({
        type: "checkbox",
        name: "plugins",
        message: "What plugins would you like to use?",
        choices: [
            { name: "eleventy-plugin-rss", checked: true },
            { name: "eleventy-plugin-syntaxhighlight" },
            { name: "eleventy-plugin-toc" },
            { name: "eleventy-plugin-external-links" },
        ],
    });

    const markdownPluginsAnswer = await inquirer.prompt({
        type: "checkbox",
        name: "markdownPlugins",
        message: "What Markdown plugins would you like to use?",
        choices: [
            { name: "markdown-it-anchor", checked: true },
            { name: "markdown-it-attrs" },
            { name: "markdown-it-emoji" },
            { name: "markdown-it-footnote" },
        ],
    });

    const pagesAnswer = await inquirer.prompt({
        type: "checkbox",
        name: "pages",
        message: "What pages would you like to use?",
        choices: [
            { name: "Blog", checked: true },
            { name: "Tags" },
        ],
    });

    const advancedAnswer = await inquirer.prompt({
        type: "confirm",
        name: "advanced",
        message: "Advanced configuration?",
    });

    let advancedConfiguration = {};
    if (advancedAnswer.advanced) {  
        advancedConfiguration = await inquirer.prompt([
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
        advancedConfiguration = {
            configFile: "eleventy.config.js",
            output: "dist",
            input: "src",
            data: "_data",
            includes: "_includes",
        };
    }


    const installAnswer = await inquirer.prompt({
        type: "confirm",
        name: "install",
        message: "Install dependencies?",
    });

    const answers = {
        name: projectNameAnswer.projectName,
        configuration: configurationAnswer.configuration,
        packs: packsAnswer.packs,
        plugins: pluginsAnswer.plugins,
        markdownPlugins: markdownPluginsAnswer.markdownPlugins,
        pages: pagesAnswer.pages,
        properties: advancedConfiguration,
        install: installAnswer.install,
    };
    generateProject(answers);
};

run();
