import child_process from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import handlebars from 'handlebars';
import kleur from 'kleur';
import prettier from 'prettier';
import ProgressBar from 'progress';

import { dirname, packageManager } from './constants.js';
import { addAddon } from './utils.js';

const __dirname = dirname(import.meta.url);

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
		for (const item of output.imports || []) imports.add(item);
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
${imports.join('\n').concat('\n')}

module.exports = function (eleventyConfig) {
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
	const directories = {
		input: path.join(project, properties.input),
		includes: path.join(project, properties.input, properties.includes),
		data: path.join(project, properties.input, properties.data),
		output: path.join(project, properties.output),
		css: path.join(project, properties.input, assets.parent, assets.css),
		js: path.join(project, properties.input, assets.parent, assets.js),
		img: path.join(project, properties.input, assets.parent, assets.img),
	};

	const restoreLog = console.log;
	console.log = options.silent ? () => {} : console.log;

	console.log(
		`\nCreating a new Eleventy site in ${kleur.blue(
			path.resolve(project),
		)}.`,
	);
	try {
		await fs.mkdir(project, { recursive: true });
	} catch {
		throw new Error(
			'Something went wrong while creating the project directory.',
		);
	}
	await fs.mkdir(directories.input);

	if (options.verbose) {
		console.log(`\nCreating some directories...`);
		console.log(`- ${kleur.dim(directories.input)}`);
	}

	for (const directory of Object.values(directories)) {
		if (directory === directories.output || directory === directories.input)
			continue;
		await fs.mkdir(directory, { recursive: true });
		if (options.verbose) console.log(`- ${kleur.dim(directory)}`);
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
	if (options.verbose) {
		console.log(
			`- ${kleur.dim(path.join(project, properties.configFile))}`,
		);
		console.log(`\nCopying files...`);
	}
	for (let [source, destination] of Object.entries({
		'logo.png': path.join(directories.img, 'logo.png'),
		'style.css': path.join(directories.css, 'style.css'),
	})) {
		await fs.copyFile(
			path.join(__dirname, '..', '/lib/files', source),
			path.join(destination),
		);
		if (options.verbose)
			console.log(`- ${kleur.dim(path.join(destination))}`);
	}

	const templates = {
		'gitignore.hbs': path.join(project, '.gitignore'),
		'README.md.hbs': path.join(project, 'README.md'),
		'index.njk.hbs': path.join(directories.input, 'index.njk'),
		'base.njk.hbs': path.join(directories.includes, 'base.njk'),
		'package.json.hbs': path.join(project, 'package.json'),
		'site.json.hbs': path.join(directories.data, 'site.json'),
	};
	const compiledTemplates = {};
	for (const [file, destination] of Object.entries(templates)) {
		const templateSource = await fs.readFile(
			path.join(__dirname, '..', 'lib', 'files', file),
			'utf8',
		);
		compiledTemplates[destination] = handlebars.compile(templateSource);
	}

	for (const [destination, template] of Object.entries(compiledTemplates)) {
		await fs.writeFile(
			path.join(destination),
			template({
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
				runCmd: packageManager(options.install).run,
			}),
		);
		if (options.verbose)
			console.log(`- ${kleur.dim(path.join(destination))}`);
	}

	const dependencies = ['@11ty/eleventy@' + options.set, 'rimraf'];
	const bar = new ProgressBar(':bar :percent', {
		complete: '▓',
		incomplete: '░',
		width: 30,
		total: dependencies.length,
	});
	console.log(
		`\nInstalling dependencies (using ${kleur.cyan(
			options.install,
		)}):\n - ${kleur.cyan(dependencies.join('\n - '))}\n`,
	);
	console.log = restoreLog;
	for (let dependency of dependencies) {
		child_process.execSync(
			`cd ${project} && ${
				packageManager(options.install).install
			} ${dependency}`,
		);
		bar.tick();
	}
	console.log(`
${kleur.green('✓ Success!')} Created ${kleur.bold(project)}.

${kleur.blue('Next steps:')}

- ${kleur.bold('cd ' + project)}
- ${kleur.bold(packageManager(options.install).run + ' start')}
- ${kleur.underline('https://www.11ty.dev/docs/')}

${kleur.yellow('Note:')} To close the dev server, press ${kleur.bold(
		'Ctrl + C',
	)} in your terminal.`);
}
