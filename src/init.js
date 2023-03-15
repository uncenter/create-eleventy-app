import { slugify, deslugify, splitPath } from "./utils.js";
import { debundle, addAddon } from "./utils.js";
import fs from "fs";
import path from "path";
import beautify from "js-beautify";
import chalk from "chalk";
import child_process from "child_process";
import ProgressBar from "progress";

export function addAllPlugins(plugins, markdownPlugins, extraImports) {
    function addPlugin(plugin) {
        return `const ${deslugify(splitPath(plugin))} = require("${plugin}");\n`;
    }
    let pluginsString = "// Imports\nconst markdownIt = require('markdown-it');\n";
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
    let pluginsString = "// Eleventy Plugins\n";
    if (plugins.length === 0) {
        pluginsString = "";
    }
    for (let plugin of plugins) {
        if (pluginOptions[plugin].options !== "") {
            pluginsString += `eleventyConfig.addPlugin(${deslugify(splitPath(plugin))}, { ${pluginOptions[plugin].options} });\n`;
        } else {
            pluginsString += `eleventyConfig.addPlugin(${deslugify(splitPath(plugin))});\n`;
        }
    }
    const markdownPluginOptions = JSON.parse(fs.readFileSync("./lib/plugins/markdown.json", "utf8"));
    let markdownPluginsString = `// Markdown Configuration\nconst mdLib = markdownIt({
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
    ${(extraSetup.length > 0) ? `// Filters, Shortcodes, and Collections\n${extraSetup.join('\n')}` : ""}
    // Passthrough Copy
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

export function generateProject(answers, options) {
    const { name, framework, bundles, filters, shortcodes, collections, eleventyPlugins, markdownPlugins, pages, properties, assets } = answers;

    const restoreLog = console.log;
    if (options.silent) {
        console.log = () => { };
    }
    // Generate project directory and subdirectories
    const projectDirectory = slugify(name);
    const inputDirectory = path.join(projectDirectory, properties.input);
    console.log(`\nGenerating project in ${chalk.blue(path.resolve(projectDirectory))}.`); // 🚀
    fs.mkdirSync(projectDirectory);
    fs.mkdirSync(inputDirectory);
    if (options.verbose) {
        console.log(`\nCreating some directories...`); // 🔨
        console.log(`- ${chalk.dim(projectDirectory)}`);
        console.log(`- ${chalk.dim(inputDirectory)}`);
    }
    const dirs = [properties.data, properties.includes];
    dirs.forEach((dir) => {
        fs.mkdirSync(path.join(inputDirectory, dir));
        if (options.verbose) {
            console.log(`- ${chalk.dim(path.join(projectDirectory, properties.input, dir))}`);
        }
    });
    const assetDirs = [assets.css, assets.js, assets.img];
    if (assets.parent !== "") fs.mkdirSync(path.join(inputDirectory, assets.parent));
    assetDirs.forEach((dir) => {
        if (assets.parent !== "") {
            console.log("Parent: " + assets.parent)
            fs.mkdirSync(path.join(inputDirectory, assets.parent, dir));
            if (options.verbose) {
                console.log(`- ${chalk.dim(path.join(projectDirectory, properties.input, assets.parent, dir))}`);
            }
        } else {
            console.log("No parent")
            fs.mkdirSync(path.join(inputDirectory, dir));
            if (options.verbose) {
                console.log(`- ${chalk.dim(path.join(projectDirectory, properties.input, dir))}`);
            }
        }
    });

    // Write config file
    fs.writeFileSync(path.join(projectDirectory, properties.configFile), beautify(createConfigFile(bundles, filters, shortcodes, collections, eleventyPlugins, markdownPlugins, properties), { indent_size: 4 }), function (err) {
        if (err) throw err;
    });
    if (options.verbose) console.log(`- ${chalk.dim(path.join(projectDirectory, properties.configFile))}`);

    // Copy template files
    if (options.verbose) console.log(`\nCopying files...`); // 📥
    const filesToCopy = {
        ".gitignore": ".gitignore",
        "README.md": "README.md",
        "index.md": path.join(properties.input, "index.md"),
        "site.json": path.join(properties.input, properties.data, "site.json"),
        "base.njk": path.join(properties.input, properties.includes, "base.njk"),
    }
    if (assets.parent !== "") {
        filesToCopy["logo.png"] = path.join(properties.input, assets.parent, assets.img, "logo.png");
        filesToCopy["style.css"] = path.join(properties.input, assets.parent, assets.css, "style.css");
    } else {
        filesToCopy["logo.png"] = path.join(properties.input, assets.img, "logo.png");
        filesToCopy["style.css"] = path.join(properties.input, assets.css, "style.css");
    }
    if (pages) {
        pages.forEach((page) => {
            page = slugify(page);
            filesToCopy[`${path.join("/pages", page)}.md`] = path.join(properties.input, `${page}.md`);
        });
    }
    for (let source in filesToCopy) {
        fs.copyFileSync(path.join("./lib/files", source), path.join(projectDirectory, filesToCopy[source]));
        if (options.verbose) console.log(`- ${chalk.dim(path.join(projectDirectory, filesToCopy[source]))}`);
    }

    // Create package.json and install dependencies
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
    if (options.verbose) console.log(`- ${chalk.dim(path.join(projectDirectory, "package.json"))}`);
    if (!options.noinstall) {
        const allDependencies = [...eleventyPlugins, ...markdownPlugins, 'markdown-it', '@11ty/eleventy@' + options.set];
        var bar = new ProgressBar('[:bar] :percent', {
            complete: '#',
            incomplete: '-',
            width: 20,
            total: allDependencies.length
        });
        console.log(`\nInstalling dependencies...\n`); // 📦
        console.log = restoreLog;
        for (let dependency of allDependencies) {
            child_process.execSync(`cd ${projectDirectory} && npm install ${dependency}`);
            bar.tick();
        }

        if (framework !== null && framework !== undefined) {
            console.log(`\nAdding ${chalk.blue(framework)}...`); // 🎨
        }
    } else {
        console.log(`\nDependencies not installed (expected, since --noinstall was passed).`);
    }
    // Print success message
    console.log(`\n${chalk.green.bold("✔️ Success!")} Project generation complete.`);
    console.log(`\n${chalk.cyan.bold("Next steps:")} \n\n- ${chalk.bold("cd", projectDirectory)} \n- ${chalk.bold("npm start")} \n- ${chalk.underline("https://www.11ty.dev/docs/")}`); // 🔥
    console.log(`\n${chalk.yellow("Note:")} To close the server, press ${chalk.bold("Ctrl + C")}.`);
};
