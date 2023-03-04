import { slugify, deslugify, splitPath } from "./utils.js";
import fs from "fs";
import path from "path";
import beautify from "js-beautify";
import chalk from "chalk";

export function addAllPlugins(plugins, markdownPlugins) {
    function addPlugin(plugin) {
        return `const ${deslugify(splitPath(plugin))} = require("${plugin}");\n`;
    }
    let pluginsString = "";
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
    let markdownPluginsString = `
    const mdLib = markdownIt({
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
    console.log(`\nGenerating project in ${chalk.blue(path.resolve(projectDirectory))}.`);
    fs.mkdirSync(projectDirectory);
    console.log(`- ${chalk.dim(projectDirectory)}`);
    fs.mkdirSync(inputDirectory);
    console.log(`- ${chalk.dim(inputDirectory)}`);
    const dirs = [properties.data, properties.includes];
    dirs.forEach((dir) => {
        fs.mkdirSync(path.join(inputDirectory, dir));
        console.log(`- ${chalk.dim(path.join(projectDirectory, properties.input, dir))}`);
    });
    fs.writeFileSync(path.join(projectDirectory, properties.configFile), beautify(createConfigFile(eleventyPlugins, markdownPlugins, properties), { indent_size: 4 }), function (err) {
        if (err) throw err;
    });
    console.log(`- ${chalk.dim(path.join(projectDirectory, properties.configFile))}`);
    console.log(`\n${chalk.green("Success!")} Project generated successfully!`);
};
