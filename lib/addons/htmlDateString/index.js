eleventyConfig.addFilter('htmlDateString', (dateObj) => {
	return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
});
