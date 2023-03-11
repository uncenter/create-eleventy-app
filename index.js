import inquirer from "inquirer";
import yargs from "yargs";
import chalk from "chalk";
import lodash from "lodash";

import { generateProject } from "./src/init.js";
import { prompts } from "./src/prompts.js";

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
if (argv.set !== "latest") {
    if (!argv.set.match(/^[0-9]+\.[0-9]+\.[0-9]+$/)) {
        console.error("You must specify a valid version of Eleventy (e.g. 2.0.0).");
        process.exit(1);
    }
}

async function run() {
    if (!argv.silent) {
        console.log(chalk.green("\n👋  Welcome to", chalk.underline.bold(lodash.startCase(__name)), "v" + __version));
        console.log(`\n✨ To get started, please answer the following questions (you can always change these settings later).\n🙋 If you are unsure about any of the questions, you can press ${chalk.bold("Enter")} to accept the default value (${chalk.italic("recommended for first-time users")}).\n`);
    }
    const project = await inquirer.prompt(prompts.project);
    const quickstart = await inquirer.prompt(prompts.quickstart);
    let customizations;
    let bundles;
    let framework;
    let properties;
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

        let framework = {};
        if (configureAdvanced.answer) {
            // framework = await inquirer.prompt(prompts.framework);
            properties = await inquirer.prompt(prompts.properties);
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
