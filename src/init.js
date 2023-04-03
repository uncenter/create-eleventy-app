import { debundle, addAddon } from './utils.js';

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import child_process from 'child_process';
import prettier from 'prettier';
import ProgressBar from 'progress';
import Handlebars from 'handlebars';
import lodash from 'lodash';

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export function addImports(plugins, imports) {
	let pluginsString = "const markdownIt = require('markdown-it');";
	for (let plugin of plugins) {
		pluginsString += `const ${lodash.camelCase(
			path.parse(plugin).name,
		)} = require("${plugin}");\n`;
	}
	if (imports.length > 0) {
		for (let imp of imports) {
			pluginsString += imp;
		}
	}
	return pluginsString;
}

export function addMarkdownConfiguration(plugins) {
	const pluginOptions = JSON.parse(
		fs.readFileSync(path.join(__dirname, '..', '/lib/plugins/markdown.json'), 'utf8'),
	);
	let configuration = `const mdLib = markdownIt({
        html: true,
        breaks: true,
        linkify: true,
    })\n`;
	for (let plugin of plugins) {
		const pluginName = lodash.camelCase(path.parse(plugin).name);
		configuration += `\t.use(${pluginName})${
			pluginOptions[plugin].options !== '' ? `, { ${pluginOptions[plugin].options} }` : ''
		}`;
		configuration +=
			plugin === markdownPlugins[markdownPlugins.length - 1] ? ';\n' : '\n';
	}
	return configuration + `\televentyConfig.setLibrary("md", mdLib);\n`;
}

function createConfigFile(
	bundles,
	filters,
	shortcodes,
	collections,
	markdownPlugins,
	properties,
	assets,
) {
	if (bundles.length > 0) {
		for (let bundle of bundles) {
			const debundled = debundle(bundle);
			filters.push(...(debundled.filters || []));
			shortcodes.push(...(debundled.shortcodes || []));
			collections.push(...(debundled.collections || []));
		}
	}
	const addons = [...filters, ...shortcodes, ...collections];
	let imports = [];
	let setup = [];
	for (let addon of addons) {
		const output = addAddon(addon);
		imports.push(...(output.imports || []));
		setup.push(output.func);
	}
	if (assets.parent !== '') {
		assets.parent += '/';
	} else {
		assets.parent = '';
	}
	return `${addImports(markdownPlugins, imports)}
module.exports = function (eleventyConfig) {
    ${addMarkdownConfiguration(markdownPlugins)}

    ${setup.length > 0 ? setup.join('\n') : ''}

    eleventyConfig.addPassthroughCopy("${properties.input}/${assets.parent}${
		assets.css
	}");
    eleventyConfig.addPassthroughCopy("${properties.input}/${assets.parent}${assets.js}");
    eleventyConfig.addPassthroughCopy("${properties.input}/${assets.parent}${
		assets.img
	}");

    return {
        dir: {
            input: "${properties.input}",
            includes: "${properties.includes}",
            data: "${properties.data}",
            output: "${properties.output}",
        },
    };
};`;
}

export function generateProject(answers, options) {
	const {
		project,
		bundles,
		filters,
		shortcodes,
		collections,
		markdownPlugins,
		pages,
		properties,
		assets,
	} = answers;

	const restoreLog = console.log;
	if (options.silent) {
		console.log = () => {};
	}

	const projectDirectory = lodash.kebabCase(project);
	const inputDirectory = path.join(projectDirectory, properties.input);
	console.log(
		`\nCreating a new Eleventy site in ${chalk.blue(path.resolve(projectDirectory))}.`,
	);
	if (!fs.existsSync(projectDirectory)) {
		fs.mkdirSync(projectDirectory);
	}
	fs.mkdirSync(inputDirectory);
	if (options.verbose) {
		console.log(`\nCreating some directories...`);
		console.log(`- ${chalk.dim(projectDirectory)}`);
		console.log(`- ${chalk.dim(inputDirectory)}`);
	}
	const dirs = [properties.data, properties.includes];
	dirs.forEach((dir) => {
		fs.mkdirSync(path.join(inputDirectory, dir));
		if (options.verbose) {
			console.log(`- ${chalk.dim(path.join(projectDirectory, properties.input, dir))}`);
		}
	});
	const assetDirs = [assets.css, assets.js, assets.img];
	if (assets.parent !== '') fs.mkdirSync(path.join(inputDirectory, assets.parent));
	assetDirs.forEach((dir) => {
		if (assets.parent !== '') {
			fs.mkdirSync(path.join(inputDirectory, assets.parent, dir));
			if (options.verbose) {
				console.log(
					`- ${chalk.dim(
						path.join(projectDirectory, properties.input, assets.parent, dir),
					)}`,
				);
			}
		} else {
			fs.mkdirSync(path.join(inputDirectory, dir));
			if (options.verbose) {
				console.log(`- ${chalk.dim(path.join(projectDirectory, properties.input, dir))}`);
			}
		}
	});

	fs.writeFileSync(
		path.join(projectDirectory, properties.configFile),
		prettier.format(
			createConfigFile(
				bundles,
				filters,
				shortcodes,
				collections,
				markdownPlugins,
				properties,
				assets,
			),
			{
				tabWidth: 2,
				printWidth: 80,
				trailingComma: 'all',
				semi: true,
				parser: 'babel',
			},
		),
		function (err) {
			if (err) throw err;
		},
	);
	if (options.verbose)
		console.log(`- ${chalk.dim(path.join(projectDirectory, properties.configFile))}`);

	if (options.verbose) console.log(`\nCopying files...`);
	const filesToCopy = {
		gitignore: '.gitignore',
		'logo.png': path.join(properties.input, assets.parent, assets.img, 'logo.png'),
		'style.css': path.join(properties.input, assets.parent, assets.css, 'style.css'),
	};
	if (pages) {
		pages.forEach((page) => {
			page = lodash.kebabCase(page);
			filesToCopy[`${path.join('/pages', page)}.md`] = path.join(
				properties.input,
				`${page}.md`,
			);
		});
	}
	for (let source in filesToCopy) {
		fs.copyFileSync(
			path.join(__dirname, '..', '/lib/files', source),
			path.join(projectDirectory, filesToCopy[source]),
		);
		if (options.verbose)
			console.log(`- ${chalk.dim(path.join(projectDirectory, filesToCopy[source]))}`);
	}
	const handlebarsData = {
		project: project,
		domain: lodash.kebabCase(project),
		input: properties.input,
		output: properties.output,
		assets: {
			img: path.join(assets.parent, assets.img),
			css: path.join(assets.parent, assets.css),
			js: path.join(assets.parent, assets.js),
		},
		configFile: properties.configFile,
		includes: properties.includes,
		data: properties.data,
	};
	var templateREADME = Handlebars.compile(
		fs
			.readFileSync(path.join(__dirname, '..', '/lib/files/README.md.hbs'), 'utf8')
			.toString(),
	);
	var templateIndex = Handlebars.compile(
		fs
			.readFileSync(path.join(__dirname, '..', '/lib/files/index.md.hbs'), 'utf8')
			.toString(),
	);
	var templateBase = Handlebars.compile(
		fs
			.readFileSync(path.join(__dirname, '..', '/lib/files/base.njk.hbs'), 'utf8')
			.toString(),
	);
	var templatePackageJson = Handlebars.compile(
		fs
			.readFileSync(path.join(__dirname, '..', '/lib/files/package.json.hbs'), 'utf8')
			.toString(),
	);
	var templateSiteJson = Handlebars.compile(
		fs
			.readFileSync(path.join(__dirname, '..', '/lib/files/site.json.hbs'), 'utf8')
			.toString(),
	);
	fs.writeFileSync(
		path.join(projectDirectory, 'README.md'),
		templateREADME(handlebarsData),
	);
	fs.writeFileSync(
		path.join(projectDirectory, properties.input, 'index.md'),
		templateIndex(handlebarsData),
	);
	fs.writeFileSync(
		path.join(projectDirectory, properties.input, properties.includes, 'base.njk'),
		templateBase(handlebarsData),
	);
	fs.writeFileSync(
		path.join(projectDirectory, 'package.json'),
		templatePackageJson(handlebarsData),
	);
	fs.writeFileSync(
		path.join(projectDirectory, properties.input, properties.data, 'site.json'),
		templateSiteJson(handlebarsData),
	);
	if (options.verbose) {
		console.log(`- ${chalk.dim(path.join(projectDirectory, 'README.md'))}`);
		console.log(
			`- ${chalk.dim(path.join(projectDirectory, properties.input, 'index.md'))}`,
		);
		console.log(
			`- ${chalk.dim(
				path.join(projectDirectory, properties.input, properties.includes, 'base.njk'),
			)}`,
		);
		console.log(`- ${chalk.dim(path.join(projectDirectory, 'package.json'))}`);
	}

	if (options.install) {
		const allDependencies = [
			...markdownPlugins,
			'markdown-it',
			'@11ty/eleventy@' + options.set,
		];
		var bar = new ProgressBar(':bar :percent', {
			complete: '▓',
			incomplete: '░',
			width: 30,
			total: allDependencies.length,
		});
		console.log(`\nInstalling dependencies...\n`);
		console.log = restoreLog;
		for (let dependency of allDependencies) {
			child_process.execSync(`cd ${projectDirectory} && npm install ${dependency}`);
			bar.tick();
		}
	} else {
		console.log(
			`\nDependencies not installed (expected, since --no-install was passed).`,
		);
	}

	console.log(`\n${chalk.green.bold('✓ Success!')} Project generation complete.`);
	console.log(
		`\n${chalk.cyan.bold('Next steps:')} \n\n- ${chalk.bold(
			'cd',
			projectDirectory,
		)} \n- ${chalk.bold('npm start')} \n- ${chalk.underline(
			'https://www.11ty.dev/docs/',
		)}`,
	);
	console.log(
		`\n${chalk.yellow('Note:')} To close the server, press ${chalk.bold('Ctrl + C')}.`,
	);
	process.exit(0);
}
