import { slugify, deslugify, splitPath } from "./utils.js";
import fs from "fs";
import path from "path";
import beautify from "js-beautify";
import chalk from "chalk";
import child_process from "child_process";

export function addAllPlugins(plugins, markdownPlugins) {
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
    return pluginsString + markdownPluginsString + `\televentyConfig.setLibrary("md", mdLib);\n`
};

function createConfigFile(plugins, markdownPlugins, properties) {
    return (`${addAllPlugins(plugins, markdownPlugins)}
module.exports = function (eleventyConfig) {
    ${setupAllPlugins(plugins, markdownPlugins)}
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
    const projectDirectory = slugify(name);
    const inputDirectory = path.join(projectDirectory, properties.input);
    console.log(`\n🤖 Generating project in ${chalk.blue(path.resolve(projectDirectory))}.`);
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
    fs.writeFileSync(path.join(projectDirectory, properties.configFile), beautify(createConfigFile(eleventyPlugins, markdownPlugins, properties), { indent_size: 4 }), function (err) {
        if (err) throw err;
    });
    console.log(`- ${chalk.dim(path.join(projectDirectory, properties.configFile))}`);
    console.log(`\n📥 Copying files...`);
    fs.copyFileSync("./lib/files/.gitignore", path.join(projectDirectory, ".gitignore"));
    console.log(`- ${chalk.dim(path.join(projectDirectory, ".gitignore"))}`);
    fs.copyFileSync("./lib/files/README.md", path.join(projectDirectory, "README.md"));
    console.log(`- ${chalk.dim(path.join(projectDirectory, "README.md"))}`);
    fs.copyFileSync("./lib/files/pages/index.md", path.join(inputDirectory, "index.md"));
    console.log(`- ${chalk.dim(path.join(projectDirectory, properties.input, "index.md"))}`);
    fs.copyFileSync("./lib/files/site.json", path.join(inputDirectory, properties.data, "site.json"));
    console.log(`- ${chalk.dim(path.join(projectDirectory, properties.input, properties.data, "site.json"))}`);
    fs.copyFileSync("./lib/files/style.css", path.join(inputDirectory, "css", "style.css"));
    console.log(`- ${chalk.dim(path.join(projectDirectory, properties.input, "css", "style.css"))}`);
    fs.copyFileSync("./lib/files/base.njk", path.join(inputDirectory, properties.includes, "base.njk"));
    console.log(`- ${chalk.dim(path.join(projectDirectory, properties.input, properties.includes, "base.njk"))}`);
    fs.copyFileSync("./lib/files/logo.png", path.join(inputDirectory, "img", "logo.png"));
    console.log(`- ${chalk.dim(path.join(projectDirectory, properties.input, "img", "logo.png"))}`);
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
    console.log(`\n${chalk.green.bold("✅ Finished!")} Project generated successfully!`);
    console.log(`\n${chalk.cyan("🔥 Next steps:")} \n\n   - ${chalk.bold("cd", projectDirectory)} \n   - ${chalk.bold("npm install")} \n   - ${chalk.bold("npm start")} \n   - Learn more in the documentation at ${chalk.underline("https://www.11ty.dev/docs/")}\n`);
};
