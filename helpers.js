export function createConfigFile(plugins, markdownPlugins, addons, configuration) {
    return `module.exports = {
    dir: {
        input: "${configuration.input}",
        output: "${configuration.output}",
        data: "${configuration.data}",
        includes: "${configuration.includes}",
    },
};`;
}