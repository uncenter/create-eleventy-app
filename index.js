import inquirer from "inquirer";
import fs from "fs";
import { createConfigFile } from "./helpers.js";

async function run() {
    const projectNameAnswer = await inquirer.prompt({
        type: "input",
        name: "projectName",
        message: "What is your project named?",
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
    });

    const customOrPacksAnswer = await inquirer.prompt({
        type: "list",
        name: "customOrPacks",
        message: "What configuration would you like to use?",
        choices: ["Packs", "Custom"],
    });

    let addonsAnswer;
    if (customOrPacksAnswer.customOrPacks === "Packs") {
        addonsAnswer = await inquirer.prompt({
            type: "checkbox",
            name: "addons",
            message: "What filter packs would you like to use?",
            choices: [
                { name: "Blog", checked: true },
                { name: "Comments" },
                { name: "Dates" },
                { name: "None" },
            ],
        });
    } else {
        addonsAnswer = await inquirer.prompt([
            {
                type: "checkbox",
                name: "filters",
                message: "What filters would you like to use?",
                choices: [
                    { name: "readingTime", checked: true },
                    { name: "readableDate" },
                    { name: "..." },
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
                    { name: "..." },
                    { name: "None" },
                ],
            },
            {
                type: "checkbox",
                name: "collections",
                message: "What collections would you like to use?",
                choices: [
                    { name: "posts", checked: true },
                    { name: "tags" },
                    { name: "..." },
                    { name: "None" },
                ],
            },
            {
                type: "checkbox",
                name: "transforms",
                message: "What transforms would you like to use?",
                choices: [
                    { name: "minify (production only)", checked: true },
                    { name: "prettify (production only)" },
                    { name: "..." },
                    { name: "None" },
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
            { name: "..." },
            { name: "None" },
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
            { name: "..." },
            { name: "None" },
        ],
    });

    const pagesAnswer = await inquirer.prompt({
        type: "checkbox",
        name: "pages",
        message: "What pages would you like to use?",
        choices: [
            { name: "Blog", checked: true },
            { name: "Tags" },
            { name: "None" },
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
        message: "Install dependencies and initialize?",
    });

    fs.mkdirSync(projectNameAnswer.projectName);
    fs.mkdirSync(`${projectNameAnswer.projectName}/${advancedConfiguration.input}`);
    fs.mkdirSync(`${projectNameAnswer.projectName}/${advancedConfiguration.input}/${advancedConfiguration.includes}`);
    fs.mkdirSync(`${projectNameAnswer.projectName}/${advancedConfiguration.input}/${advancedConfiguration.data}`);
    fs.writeFile(`${projectNameAnswer.projectName}/${advancedConfiguration.configFile}`, createConfigFile(pluginsAnswer, markdownPluginsAnswer, addonsAnswer, advancedConfiguration), function (err) {
        if (err) throw err;
    }); 

};

run();
