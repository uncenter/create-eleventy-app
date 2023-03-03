import lodash from "lodash";

export function deslugify(string) {
    return lodash.camelCase(string);
}

export function slugify(string) {
    return lodash.kebabCase(string);
}

export function splitPath(path) {
    return path.split("/")[path.split("/").length - 1];
}