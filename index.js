#!/usr/bin/env node

import inquirer from "inquirer";
import yargs from "yargs";
import chalk from "chalk";
import lodash from "lodash";

import { generateProject } from "./src/init.js";
import { prompts } from "./src/prompts.js";
import { queryPackage, dirExists } from "./src/utils.js";

const __name = "create-eleventy-app";
const __version = "1.0.0";

const argv = yargs(process.argv.slice(2))
    .command("new", "Create a new Eleventy project", (yargs) => {
        yargs.positional("name", {
            describe: "Name of the project",
            type: "string",
        });
    })
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
if (argv.set !== "latest") {
    const data = await queryPackage("@11ty/eleventy");
    if (!data.versions.includes(argv.set)) {
        console.error(`@11ty/eleventy@${argv.set} does not exist. Please use a valid version number (e.g. ${data.version}).`);
        process.exit(1);
    }
}
if (argv._[0] === "new") {
    if (argv._[1]) {
        if (dirExists(argv._[1])) {
            console.error(`A directory with that name already exists.`);
            process.exit(1);
        }
        if (!(argv._[1].trim() === "")) {
            argv.name = argv._[1];
        }
    }
}

async function run() {
    let project;
    if (!argv.name) {
        project = await inquirer.prompt(prompts.project);
    } else {
        project = { name: argv.name };
    }
    const quickstart = await inquirer.prompt(prompts.quickstart);

    let customizations = { filters: [], shortcodes: [], collections: [], eleventyPlugins: [], markdownPlugins: [], pages: [] };
    let bundles = { selected: [] };
    let properties = {
        configFile: "eleventy.config.js",
        output: "dist",
        input: "src",
        data: "_data",
        includes: "_includes",
    };
    let assets = {
        parent: "",
        css: "css",
        js: "js",
        img: "images",
    };
    if (quickstart.answer) {
        bundles = await inquirer.prompt(prompts.bundles);
    } else {
        const useBundles = await inquirer.prompt(prompts.useBundles);
        if (useBundles.answer) {
            bundles = await inquirer.prompt(prompts.bundles);
        } else {
            customizations = await inquirer.prompt(prompts.customizations);
        }
        const configureAdvanced = await inquirer.prompt(prompts.configureAdvanced);

        if (configureAdvanced.answer) {
            properties = await inquirer.prompt(prompts.properties);
            const configureAssets = await inquirer.prompt(prompts.configureAssets);
            if (configureAssets.answer) {
                assets = await inquirer.prompt(prompts.assets);
            }
        }
    }

    const answers = {
        project: project.name,
        bundles: bundles.selected,
        ...customizations,
        pages: customizations.pages,
        properties: properties,
        assets: assets,
    };
    generateProject(answers, argv);
};

run();
