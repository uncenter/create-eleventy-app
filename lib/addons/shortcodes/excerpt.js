eleventyConfig.addShortcode("excerpt", (article) => {
    if (!Object.prototype.hasOwnProperty.call(article, "content")) {
        console.warn(
            'Failed to extract excerpt: Document has no property "content".'
        );
        return null;
    }

    const content = article.templateContent;
    const excerpt = content.slice(0, content.indexOf("\n"));

    return excerpt.replace(/(<([^>]+)>)/gi, "");
});