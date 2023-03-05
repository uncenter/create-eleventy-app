import { slugify, deslugify, splitPath } from "./utils.js";
import { copyFilePrint } from "./utils.js";
import { debundle, addAddon } from "./utils.js";
import fs from "fs";
import path from "path";
import beautify from "js-beautify";
import chalk from "chalk";
import child_process from "child_process";

export function addAllPlugins(plugins, markdownPlugins, extraImports) {
    function addPlugin(plugin) {
        return `const ${deslugify(splitPath(plugin))} = require("${plugin}");\n`;
    }
    let pluginsString = "const markdownIt = require('markdown-it');\n";
    for (let plugin of plugins) {
        pluginsString += addPlugin(plugin);
    }
    for (let markdownPlugin of markdownPlugins) {
        pluginsString += addPlugin(markdownPlugin);
    }
    if (extraImports.length > 0) {
        for (let extraImport of extraImports) {
            pluginsString += extraImport;
        }
    }
    return pluginsString;
};

export function setupAllPlugins(plugins, markdownPlugins) {
    const pluginOptions = JSON.parse(fs.readFileSync("./lib/plugins/eleventy.json", "utf8"));
    let pluginsString = "";
    for (let plugin of plugins) {
        if (pluginOptions[plugin].options !== "") {
            pluginsString += `eleventyConfig.addPlugin(${deslugify(splitPath(plugin))}, { ${pluginOptions[plugin].options} });\n`;
        } else {
            pluginsString += `eleventyConfig.addPlugin(${deslugify(splitPath(plugin))});\n`;
        }
    }
    const markdownPluginOptions = JSON.parse(fs.readFileSync("./lib/plugins/markdown.json", "utf8"));
    let markdownPluginsString = `const mdLib = markdownIt({
        html: true,
        breaks: true,
        linkify: true,
    })\n`;
    for (let markdownPlugin of markdownPlugins) {
        if (markdownPluginOptions[markdownPlugin].options !== "") {
            markdownPluginsString += `\t.use(${deslugify(splitPath(markdownPlugin))}, { ${markdownPluginOptions[markdownPlugin].options} })`;
        } else {
            markdownPluginsString += `\t.use(${deslugify(splitPath(markdownPlugin))})`;
        }
        if (markdownPlugin === markdownPlugins[markdownPlugins.length - 1]) {
            markdownPluginsString += ";\n";
        } else {
            markdownPluginsString += "\n";
        }
    }
    return pluginsString + markdownPluginsString + `\televentyConfig.setLibrary("md", mdLib);\n`;
};

function createConfigFile(bundles, addonFilters, addonShortcodes, addonCollections, addonPlugins, addonMarkdownPlugins, properties) {
    if (bundles.length > 0) {
        for (let bundle of bundles) {
            const { plugins, filters, shortcodes, collections } = debundle(bundle);
            addonPlugins.push(...(plugins || []));
            addonFilters.push(...(filters || []));
            addonShortcodes.push(...(shortcodes || []));
            addonCollections.push(...(collections || []));
        }
    }
    const addons = [...addonFilters, ...addonShortcodes, ...addonCollections];
    let extraImports = [];
    let extraSetup = [];
    for (let addon of addons) {
        const { imports, func } = addAddon(addon);
        extraImports.push(...(imports || []));
        extraSetup.push(func);
    }
    return (`${addAllPlugins(addonPlugins, addonMarkdownPlugins, extraImports)}
module.exports = function (eleventyConfig) {
    ${setupAllPlugins(addonPlugins, addonMarkdownPlugins)}
    ${extraSetup.join("\n")}
    eleventyConfig.addPassthroughCopy("${properties.input}/css");
    eleventyConfig.addPassthroughCopy("${properties.input}/js");
    eleventyConfig.addPassthroughCopy("${properties.input}/img");
    return {
        dir: {
            input: "${properties.input}",
            output: "${properties.output}",
            data: "${properties.data}",
            includes: "${properties.includes}",
        },
    };
};` );
};

export function generateProject(answers) {
    const { name, framework, bundles, filters, shortcodes, collections, eleventyPlugins, markdownPlugins, pages, properties } = answers;

    // Generate project directory and subdirectories
    const projectDirectory = slugify(name);
    const inputDirectory = path.join(projectDirectory, properties.input);
    console.log(`\n🚀 Generating project in ${chalk.blue(path.resolve(projectDirectory))}.`);
    console.log(`\n🔨 Creating some directories...`);
    fs.mkdirSync(projectDirectory);
    console.log(`- ${chalk.dim(projectDirectory)}`);
    fs.mkdirSync(inputDirectory);
    console.log(`- ${chalk.dim(inputDirectory)}`);
    const dirs = [properties.data, properties.includes, 'css', 'js', 'img'];
    dirs.forEach((dir) => {
        fs.mkdirSync(path.join(inputDirectory, dir));
        console.log(`- ${chalk.dim(path.join(projectDirectory, properties.input, dir))}`);
    });

    // Write config file
    fs.writeFileSync(path.join(projectDirectory, properties.configFile), beautify(createConfigFile(bundles, filters, shortcodes, collections, eleventyPlugins, markdownPlugins, properties), { indent_size: 4 }), function (err) {
        if (err) throw err;
    });
    console.log(`- ${chalk.dim(path.join(projectDirectory, properties.configFile))}`);

    // Copy template files
    console.log(`\n📥 Copying files...`);
    const filesToCopy = {
        ".gitignore": ".gitignore",
        "README.md": "README.md",
        "index.md": path.join(properties.input, "index.md"),
        "site.json": path.join(properties.input, properties.data, "site.json"),
        "style.css": path.join(properties.input, "css/style.css"),
        "base.njk": path.join(properties.input, properties.includes, "base.njk"),
        "logo.png": path.join(properties.input, "img/logo.png")
    }
    if (pages) {
        pages.forEach((page) => {
            page = slugify(page);
            filesToCopy[`${path.join("/pages", page)}.md`] = path.join(properties.input, `${page}.md`);
        });
    }
    for (let source in filesToCopy) {
        copyFilePrint(path.join("./lib/files", source), path.join(projectDirectory, filesToCopy[source]));
    }

    // Create package.json and install dependencies
    console.log(`\n📝 Creating package.json...`);
    fs.writeFileSync(path.join(projectDirectory, "package.json"), beautify(`{
        "name": "${name}",
        "private": true,
        "version": "1.0.0",
        "description": "A new Eleventy project",
        "main": "${properties.configFile}",
        "scripts": {
            "clean": "rm -rf ${properties.output}",
            "start": "eleventy --serve",
            "build": "eleventy"
        },
        "author": "",
        "license": "MIT",
        "dependencies": {}
    }`, { indent_size: 4 }), function (err) {
        if (err) throw err;
    });
    console.log(`- ${chalk.dim(path.join(projectDirectory, "package.json"))}`);
    console.log(`\n📦 Installing dependencies...`);
    child_process.execSync(`cd ${projectDirectory} && npm install @11ty/eleventy`);
    for (let plugin of eleventyPlugins) {
        child_process.execSync(`cd ${projectDirectory} && npm install ${plugin}`);
    }
    child_process.execSync(`cd ${projectDirectory} && npm install markdown-it`);
    for (let markdownPlugin of markdownPlugins) {
        child_process.execSync(`cd ${projectDirectory} && npm install ${markdownPlugin}`);
    }

    if (framework !== undefined) {
        console.log(`\n🎨 Installing ${chalk.blue(framework)}...`);
    }
    console.log(`\n🧹 Cleaning up...`);

    // Print success message
    console.log(`\n${chalk.green.bold("⭐ Success!")} Project generation complete!`);
    console.log(`\n${chalk.cyan("🔥 Next steps!")} \n\n- ${chalk.bold("cd", projectDirectory)} \n- ${chalk.bold("npm start")} \n- ${chalk.underline("https://www.11ty.dev/docs/")}\n`);
};
