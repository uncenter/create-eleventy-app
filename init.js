import { slugify, deslugify, splitPath } from "./utils.js";
import fs from "fs";
import path from "path";
import beautify from "js-beautify";

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
    const pluginOptions = JSON.parse(fs.readFileSync("./lib/src/plugins/eleventy.json", "utf8"));
    let pluginsString = "";
    for (let plugin of plugins) {
        if (pluginOptions[plugin].options !== "") {
            pluginsString += `eleventyConfig.addPlugin(${deslugify(splitPath(plugin))}, { ${pluginOptions[plugin].options} });\n`;
        } else {
            pluginsString += `eleventyConfig.addPlugin(${deslugify(splitPath(plugin))});\n`;
        }
    }
    const markdownPluginOptions = JSON.parse(fs.readFileSync("./lib/src/plugins/markdown.json", "utf8"));
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
    console.log("Generating Eleventy project in " + "\x1b[31m" + __dirname + "/" + projectDirectory + "\x1b[0m" + ".");
    fs.mkdirSync(projectDirectory);
    fs.mkdirSync(inputDirectory);
    console.log("Eleventy directories generated:\n" + "\x1b[31m");
    const dirs = [properties.data, properties.includes];
    dirs.forEach((dir) => {
        fs.mkdirSync(path.join(inputDirectory, dir));
        console.log(`- ${__dirname}/${projectDirectory}/${properties.input}/${dir}`);
    });
    console.log("\x1b[0m");
    fs.writeFile(path.join(projectDirectory, properties.configFile), beautify(createConfigFile(eleventyPlugins, markdownPlugins, properties), { indent_size: 4 }), function (err) {
        if (err) throw err;
    });
    console.log(`Eleventy configuration file generated in \x1b[31m${__dirname}/${projectDirectory}/${properties.configFile}.\x1b[0m`);
};
