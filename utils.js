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

export function generateOptions(pathString) {
    if (!fs.existsSync(pathString)) {
        throw new Error("Path does not exist.");
    }
    if (fs.lstatSync(pathString).isDirectory()) {
        const files = fs.readdirSync(pathString);
        let fileNames = [];
        for (let file of files) {
            if (path.parse(file).ext === ".md" || path.parse(file).ext === ".json") {
                file = lodash.startCase(path.parse(file).name);
            } else {
                file = path.parse(file).name;
            }
            fileNames.push( { name: file });
        }
        return fileNames;
    } else {
        const items = JSON.parse(fs.readFileSync(pathString, "utf8"));
        return Object.keys(items).map((item) => {
            return { name: item };
        });
    }
}