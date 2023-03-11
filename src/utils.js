import lodash from "lodash";
import fs from "fs";
import path from "path";

export function deslugify(string) {
    return lodash.camelCase(string);
}

export function slugify(string) {
    return lodash.kebabCase(string);
}

export function splitPath(pathString) {
    return path.parse(pathString).name;
}

export function dirExists(pathString) {
    if (!fs.existsSync(pathString)) {
        return false;
    } else if (fs.lstatSync(pathString).isDirectory()) {
        if (fs.readdirSync(pathString).length > 0) {
            return true;
        } else {
            return false;
        }
    } else {
        throw new Error("Path is not a directory.");
    }
}

export function generateOptions(pathString) {
    if (!fs.existsSync(pathString)) {
        throw new Error("Path does not exist.");
    }
    if (fs.lstatSync(pathString).isDirectory()) {
        const files = fs.readdirSync(pathString);
        let fileNames = [];
        for (let file of files) {
            if (path.parse(file).ext === ".md" || path.parse(file).ext === ".json" || path.parse(file).ext === ".njk") {
                file = lodash.startCase(path.parse(file).name);
            } else {
                file = path.parse(file).name;
            }
            fileNames.push({ name: file });
        }
        return fileNames;
    } else {
        const items = JSON.parse(fs.readFileSync(pathString, "utf8"));
        return Object.keys(items).map((item) => {
            return { name: item };
        });
    }
}

export function debundle(bundle) {
    bundle = JSON.parse(fs.readFileSync(path.join("./lib/addons/bundles", slugify(bundle) + ".json"), "utf8"));
    return { plugins: bundle.plugins, filters: bundle.filters, shortcodes: bundle.shortcodes, collections: bundle.collections };
}

function findFile(filename, parentDirectory) {
    const files = fs.readdirSync(parentDirectory);
    for (let file of files) {
        if (fs.lstatSync(path.join(parentDirectory, file)).isDirectory()) {
            const result = findFile(filename, path.join(parentDirectory, file));
            if (result) {
                return result;
            }
        } else if (file === filename) {
            return path.join(parentDirectory, file);
        }
    }
    return false;
}

export function addAddon(addonName) {
    let addon = fs.readFileSync(findFile(addonName + ".js", "./lib/addons"), "utf8");
    const imports = addon.match(/const .* = require\(".*"\);/g);
    if (imports) {
        for (let imp of imports) {
            addon = addon.replace(imp, "");
        }
    }
    const func = addon;
    return { imports, func };
}

export function removeDuplicateImports(file) {
    const uniqueImports = [];
    const imports = file.match(/const .* = require\(".*"\);/g);
    for (let imp of imports) {
        if (!uniqueImports.includes(imp)) {
            uniqueImports.push(imp);
        } else {
            file = file.replace(imp, "");
        }
    }
    return file;
}

// console.log(removeDuplicateImports(fs.readFileSync("./my-project/eleventy.config.js", "utf8")));