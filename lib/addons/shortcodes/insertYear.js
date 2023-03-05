eleventyConfig.addFilter("insertYear", () => {
    return new Date().getFullYear();
});