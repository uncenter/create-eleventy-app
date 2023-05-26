import { addAddon } from './utils.js';

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import child_process from 'child_process';
import prettier from 'prettier';

import ProgressBar from 'progress';
import Handlebars from 'handlebars';

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

function createConfigFile({ properties, filters, shortcodes, collections, assets } = {}) {
	const addons = [...(filters || []), ...(shortcodes || []), ...(collections || [])];
	let imports = [];
	let setup = [];
	for (let addon of addons) {
		const output = addAddon(addon);
		imports.push(...(output.imports || []));
		setup.push(output.func);
	}

	let passthroughCopy = [];
	for (let asset of Object.values(assets).filter((asset) => assets.parent !== asset)) {
		passthroughCopy.push(
			`eleventyConfig.addPassthroughCopy(${JSON.stringify(
				path.join(properties.input, assets.parent, asset),
			)});`,
		);
	}

	return `
const markdownIt = require('markdown-it');
${imports.join('\n').concat('\n')}

module.exports = function (eleventyConfig) {
    const mdLib = markdownIt({
        html: true,
        breaks: true,
        linkify: true
    });
    eleventyConfig.setLibrary("md", mdLib);

    ${setup.join('\n')}

    ${passthroughCopy.join('\n')}

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
	const { project, filters, shortcodes, collections, properties, assets } = answers;

	const restoreLog = console.log;
	if (options.silent) {
		console.log = () => {};
	}
	const dirs = {
		input: path.join(project, properties.input),
		includes: path.join(project, properties.input, properties.includes),
		data: path.join(project, properties.input, properties.data),
		output: path.join(project, properties.output),
		css: path.join(project, properties.input, assets.parent, assets.css),
		js: path.join(project, properties.input, assets.parent, assets.js),
		img: path.join(project, properties.input, assets.parent, assets.img),
	};

	console.log(`\nCreating a new Eleventy site in ${chalk.blue(path.resolve(project))}.`);
	if (!fs.existsSync(project)) {
		fs.mkdirSync(project);
	}
	fs.mkdirSync(dirs.input);
	if (options.verbose) {
		console.log(`\nCreating some directories...`);
		console.log(`- ${chalk.dim(dirs.input)}`);
	}
	[...Object.values(dirs).filter((dir) => dir !== dirs.output)]
		.filter((dir) => dir !== dirs.input)
		.forEach((dir) => {
			fs.mkdirSync(dir, { recursive: true });
			if (options.verbose) {
				console.log(`- ${chalk.dim(dir)}`);
			}
		});

	fs.writeFileSync(
		path.join(project, properties.configFile),
		prettier.format(
			createConfigFile({
				properties,
				filters,
				shortcodes,
				collections,
				assets,
			}),
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
		console.log(`- ${chalk.dim(path.join(project, properties.configFile))}`);

	if (options.verbose) console.log(`\nCopying files...`);
	for (let [source, destination] of Object.entries({
		gitignore: path.join(project, '.gitignore'),
		'logo.png': path.join(dirs.img, 'logo.png'),
		'style.css': path.join(dirs.css, 'style.css'),
	})) {
		fs.copyFileSync(
			path.join(__dirname, '..', '/lib/files', source),
			path.join(destination),
		);
		if (options.verbose) console.log(`- ${chalk.dim(path.join(destination))}`);
	}
	const templates = {
		'README.md.hbs': path.join(project, 'README.md'),
		'index.md.hbs': path.join(dirs.input, 'index.md'),
		'base.njk.hbs': path.join(dirs.includes, 'base.njk'),
		'package.json.hbs': path.join(project, 'package.json'),
		'site.json.hbs': path.join(dirs.data, 'site.json'),
	};
	const compiledTemplates = Object.fromEntries(
		Object.entries(templates).map(([templateFile, outputFile]) => {
			const templateSource = fs.readFileSync(
				path.join(__dirname, '..', 'lib', 'files', templateFile),
				'utf8',
			);
			return [outputFile, Handlebars.compile(templateSource)];
		}),
	);
	const handlebarsData = {
		project,
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
	Object.entries(compiledTemplates).forEach(([outputFile, compiledTemplate]) => {
		fs.writeFileSync(path.join(outputFile), compiledTemplate(handlebarsData));
		if (options.verbose) console.log(`- ${chalk.dim(path.join(outputFile))}`);
	});

	const dependencies = ['markdown-it', '@11ty/eleventy@' + options.set, 'rimraf'];
	var bar = new ProgressBar(':bar :percent', {
		complete: '▓',
		incomplete: '░',
		width: 30,
		total: dependencies.length,
	});
	console.log(
		`\nInstalling dependencies (using ${chalk.cyan(options.install)}):\n - ${chalk.cyan(
			dependencies.join('\n - '),
		)}\n`,
	);
	console.log = restoreLog;
	for (let dependency of dependencies) {
		child_process.execSync(
			`cd ${project} && ${
				{
					npm: 'npm install',
					yarn: 'yarn add',
					pnpm: 'pnpm add',
				}[options.install]
			} ${dependency}`,
		);
		bar.tick();
	}
	console.log(`
${chalk.green('✓ Success!')} Created ${chalk.bold(project)} at ${path.resolve(project)}

${chalk.blue('Next steps:')}

- ${chalk.bold('cd', project)}
- ${chalk.bold(options.install + ' start')}
- ${chalk.underline('https://www.11ty.dev/docs/')}

${chalk.yellow('Note:')} To close the dev server, press ${chalk.bold(
		'Ctrl + C',
	)} in your terminal.`);
	process.exit(0);
}
