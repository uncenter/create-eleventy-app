import lodash from "lodash";
import fs from "fs";
import path from "path";

export function deslugify(string) {
    return lodash.camelCase(string);
}

export function slugify(string) {
    return lodash.kebabCase(string);
}

export function splitPath(path) {
    return path.split("/")[path.split("/").length - 1];
}

export function generateOptions(path) {
    const items = JSON.parse(fs.readFileSync(path, "utf8"));
    return Object.keys(items).map((item) => {
        return { name: item };
    });
}
