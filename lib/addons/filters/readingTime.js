eleventyConfig.addFilter("readingTime", (content) => {
    Math.ceil(content.split(" ").length / 238);
});
