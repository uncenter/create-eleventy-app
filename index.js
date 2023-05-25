#!/usr/bin/env node --no-warnings

import inquirer from 'inquirer';
import lodash from 'lodash';
import updateNotifier from 'update-notifier';
import packageJson from './package.json' assert { type: 'json' };

import { generateProject } from './src/init.js';
import { prompts } from './src/prompts.js';
import { queryPackage } from './src/utils.js';
import { Command } from 'commander';

const __version = packageJson.version;

const notifier = updateNotifier({
	pkg: packageJson,
	updateCheckInterval: 1000 * 60 * 60 * 12,
	isGlobal: true,
	boxenOptions: {
		padding: 1,
		margin: 1,
		textAlignment: 'center',
		borderColor: 'cyan',
		borderStyle: 'bold',
	},
});

notifier.notify();

const program = new Command();
program
	.version(__version)
	.option('-v, --verbose', 'print verbose output', false)
	.option('-s, --silent', 'silence all output', false)
	.option('-e, --set <version>', 'use a specific version of Eleventy', 'latest')
	.option('-n, --no-install', 'do not install dependencies');

program.parse(process.argv);
const options = program.opts();

if (options.verbose && options.silent) {
	console.error('You cannot use both --verbose and --silent.');
	process.exit(1);
}
if (options.set !== 'latest' && options.set !== 'next') {
	const data = await queryPackage('@11ty/eleventy');
	if (!data.versions.includes(options.set)) {
		console.error(
			`@11ty/eleventy@${options.set} does not exist. Please use a valid version number (e.g. ${data.version}).`,
		);
		process.exit(1);
	}
}

async function run() {
	const project = await inquirer.prompt(prompts.project);

	let customizations = {
		filters: [],
		shortcodes: [],
		collections: [],
	};

	let properties = {
		configFile: 'eleventy.config.js',
		output: 'dist',
		input: 'src',
		data: '_data',
		includes: '_includes',
	};

	let assets = {
		parent: 'assets',
		css: 'css',
		js: 'js',
		img: 'img',
	};
	const configureAdvanced = await inquirer.prompt(prompts.configureAdvanced);
	if (configureAdvanced.answer) {
		properties = await inquirer.prompt(prompts.properties);
		const configureAssets = await inquirer.prompt(prompts.configureAssets);
		if (configureAssets.answer) {
			assets = await inquirer.prompt(prompts.assets);
		}
	}

	const answers = {
		project: lodash.kebabCase(project.name),
		...customizations,
		properties: properties,
		assets: assets,
	};
	generateProject(answers, options);
}

run();
