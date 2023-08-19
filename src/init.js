import { addAddon } from './utils.js';

import fs from 'fs/promises';
import path from 'path';
import kleur from 'kleur';
import child_process from 'child_process';
import * as prettier from 'prettier';

import ProgressBar from 'progress';
import Handlebars from 'handlebars';

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

async function createConfigFile({
	properties,
	filters,
	shortcodes,
	collections,
	assets,
} = {}) {
	const addons = [
		...(filters || []),
		...(shortcodes || []),
		...(collections || []),
	];
	let imports = new Set();
	let setup = new Set();
	for (let addon of addons) {
		const output = await addAddon(addon);
		(output.imports || []).forEach((item) => imports.add(item));
		setup.add(output.func);
	}
	imports = [...imports];
	setup = [...setup];

	let passthroughCopy = [];
	for (let asset of Object.values(assets).filter(
		(asset) => assets.parent !== asset,
	)) {
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

export async function generateProject(answers, options) {
	const { project, filters, shortcodes, collections, properties, assets } =
		answers;
	const dirs = {
		input: path.join(project, properties.input),
		includes: path.join(project, properties.input, properties.includes),
		data: path.join(project, properties.input, properties.data),
		output: path.join(project, properties.output),
		css: path.join(project, properties.input, assets.parent, assets.css),
		js: path.join(project, properties.input, assets.parent, assets.js),
		img: path.join(project, properties.input, assets.parent, assets.img),
	};
	let log = options.silent ? () => {} : console.log;

	options.runCmd = {
		npm: 'npm run',
		yarn: 'yarn',
		pnpm: 'pnpm',
	}[options.install];
	options.installCmd = {
		npm: 'npm install',
		yarn: 'yarn add',
		pnpm: 'pnpm add',
	}[options.install];

	log(
		`\nCreating a new Eleventy site in ${kleur.blue(path.resolve(project))}.`,
	);
	try {
		await fs.mkdir(project, { recursive: true });
	} catch {
		log('Something went wrong while creating the project directory.');
		process.exit(1);
	}
	await fs.mkdir(dirs.input);

	if (options.verbose) {
		log(`\nCreating some directories...`);
		log(`- ${kleur.dim(dirs.input)}`);
	}

	for (const dir of Object.values(dirs).filter(
		(dir) => dir !== dirs.output && dir !== dirs.input,
	)) {
		await fs.mkdir(dir, { recursive: true });
		if (options.verbose) {
			log(`- ${kleur.dim(dir)}`);
		}
	}

	await fs.writeFile(
		path.join(project, properties.configFile),
		await prettier.format(
			await createConfigFile({
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
	);
	if (options.verbose)
		log(`- ${kleur.dim(path.join(project, properties.configFile))}`);

	if (options.verbose) log(`\nCopying files...`);
	for (let [source, destination] of Object.entries({
		'logo.png': path.join(dirs.img, 'logo.png'),
		'style.css': path.join(dirs.css, 'style.css'),
	})) {
		await fs.copyFile(
			path.join(__dirname, '..', '/lib/files', source),
			path.join(destination),
		);
		if (options.verbose) log(`- ${kleur.dim(path.join(destination))}`);
	}
	const templates = {
		'gitignore.hbs': path.join(project, '.gitignore'),
		'README.md.hbs': path.join(project, 'README.md'),
		'index.md.hbs': path.join(dirs.input, 'index.md'),
		'base.njk.hbs': path.join(dirs.includes, 'base.njk'),
		'package.json.hbs': path.join(project, 'package.json'),
		'site.json.hbs': path.join(dirs.data, 'site.json'),
	};

	const compiledTemplates = {};

	for (const [templateFile, outputFile] of Object.entries(templates)) {
		const templateSource = await fs.readFile(
			path.join(__dirname, '..', 'lib', 'files', templateFile),
			'utf8',
		);
		compiledTemplates[outputFile] = Handlebars.compile(templateSource);
	}

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
		runCmd: options.runCmd,
	};
	for (const [outputFile, compiledTemplate] of Object.entries(
		compiledTemplates,
	)) {
		await fs.writeFile(path.join(outputFile), compiledTemplate(handlebarsData));
		if (options.verbose) log(`- ${kleur.dim(path.join(outputFile))}`);
	}

	const dependencies = [
		'markdown-it',
		'@11ty/eleventy@' + options.set,
		'rimraf',
	];
	var bar = new ProgressBar(':bar :percent', {
		complete: '▓',
		incomplete: '░',
		width: 30,
		total: dependencies.length,
	});
	log(
		`\nInstalling dependencies (using ${kleur.cyan(
			options.install,
		)}):\n - ${kleur.cyan(dependencies.join('\n - '))}\n`,
	);
	log = console.log;
	for (let dependency of dependencies) {
		child_process.execSync(
			`cd ${project} && ${options.installCmd} ${dependency}`,
		);
		bar.tick();
	}
	log(`
${kleur.green('✓ Success!')} Created ${kleur.bold(project)}.

${kleur.blue('Next steps:')}

- ${kleur.bold('cd ' + project)}
- ${kleur.bold(options.runCmd + ' start')}
- ${kleur.underline('https://www.11ty.dev/docs/')}

${kleur.yellow('Note:')} To close the dev server, press ${kleur.bold(
		'Ctrl + C',
	)} in your terminal.`);
	process.exit(0);
}
