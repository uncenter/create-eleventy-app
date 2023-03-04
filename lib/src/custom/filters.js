eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
    return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(
        format || "dd LLLL yyyy"
    );
});

eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
        "yyyy-LL-dd"
    );
});

eleventyConfig.addFilter("getAllTags", (collection) => {
    let tagSet = new Set();
    for (let item of collection) {
        (item.data.tags || []).forEach((tag) => tagSet.add(tag));
    }
    return Array.from(tagSet);
});

eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
    return (tags || []).filter(
        (tag) => ["all", "nav", "post", "posts"].indexOf(tag) === -1
    );
});