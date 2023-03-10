import { dirExists, generateOptions } from "./utils.js";

const project = () => ({
    type: "input",
    name: "name",
    message: "What would you like to name your project?",
    default: "my-project",
    validate: (input) => {
        if (dirExists(input)) {
            return "A directory with that name already exists.";
        }
        if (input.trim() === "") {
            return "Please enter a project name.";
        }
        return true;
    },
});

const quickstart = () => ({
    type: "confirm",
    name: "answer",
    message: "Quickstart? (recommended for first-time users)",
    default: true,
});

const useBundles = () => ({
    type: "confirm",
    name: "answer",
    message: "Use starter bundles?",
    default: false,
});

const bundles = () => ({
    type: "checkbox",
    name: "selected",
    message: "What bundles would you like to use?",
    choices: generateOptions("./lib/addons/bundles/"),
});

const customizations = () => ([
    {
        type: "checkbox",
        name: "filters",
        message: "What filters would you like to use?",
        choices: generateOptions("./lib/addons/filters/"),
        loop: false,
    },
    {
        type: "checkbox",
        name: "shortcodes",
        message: "What shortcodes would you like to use?",
        choices: generateOptions("./lib/addons/shortcodes/"),
        loop: false,
    },
    {
        type: "checkbox",
        name: "collections",
        message: "What collections would you like to use?",
        choices: generateOptions("./lib/addons/collections/"),
        loop: false,
    },
    {
        type: "checkbox",
        name: "eleventyPlugins",
        message: "What plugins would you like to use?",
        choices: generateOptions("./lib/plugins/eleventy.json"),
    },
    {
        type: "checkbox",
        name: "markdownPlugins",
        message: "What Markdown plugins would you like to use?",
        choices: generateOptions("./lib/plugins/markdown.json"),
    },
    // {
    //     type: "checkbox",
    //     name: "pages",
    //     message: "What page templates would you like to add?",
    //     choices: generateOptions("./lib/files/pages/"),
    // }
]);

const configureAdvanced = () => ({
    type: "confirm",
    name: "answer",
    message: "Configure advanced properties?",
    default: false,
});

const framework = () => ({
    type: "list",
    name: "answer",
    message: "Would you like to add a framework?",
    choices: [
        "None",
        "Sass",
        "Tailwind",
        "Tailwind + Sass",
    ],
    default: "None",
});

const properties = () => ([
    {
        type: "list",
        name: "configFile",
        message: "Set Eleventy config file path?",
        choices: ["eleventy.config.js", "eleventy.config.cjs", ".eleventy.js"],
        default: "eleventy.config.js",
    },
    {
        type: "input",
        name: "output",
        message: "Set output directory?",
        default: "dist",
    },
    {
        type: "input",
        name: "input",
        message: "Set input directory?",
        default: "src",
    },
    {
        type: "input",
        name: "data",
        message: "Set data directory?",
        default: "_data",
    },
    {
        type: "input",
        name: "includes",
        message: "Set includes directory?",
        default: "_includes",
    },
]);



export const prompts = {
    project: project(),
    quickstart: quickstart(),
    bundles: bundles(),
    useBundles: useBundles(),
    customizations: customizations(),
    configureAdvanced: configureAdvanced(),
    framework: framework(),
    properties: properties(),
};