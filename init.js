import { slugify, deslugify, splitPath } from "./utils.js";
import fs from "fs";
import path from "path";

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
    let pluginsString = "";
    for (let plugin of plugins) {
        pluginsString += `eleventyConfig.addPlugin(${deslugify(splitPath(plugin))});\n`;
    }
    let markdownPluginsString = `
    const mdLib = markdownIt({
        html: true,
        breaks: true,
        linkify: true,
    })\n`;
    for (let markdownPlugin of markdownPlugins) {
        markdownPluginsString += `.use(${deslugify(splitPath(markdownPlugin))})`;
        if (markdownPlugin === markdownPlugins[markdownPlugins.length - 1]) {
            markdownPluginsString += ";\n";
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
    const { name, configuration, plugins, markdownPlugins, pages, properties } = answers;
    const project = slugify(name);
    const inputDir = path.join(project, properties.input);
    console.log(project);
    fs.mkdirSync(project);
    fs.mkdirSync(inputDir);
    const dirs = [properties.data, properties.includes];
    dirs.forEach((dir) => {
        fs.mkdirSync(path.join(inputDir, dir));
    });
    fs.writeFile(path.join(project, properties.configFile), createConfigFile(plugins, markdownPlugins, properties), function (err) {
        if (err) throw err;
    });
};
