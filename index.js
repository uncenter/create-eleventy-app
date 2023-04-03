#!/usr/bin/env node

import inquirer from 'inquirer';
import path from 'path';

import { generateProject } from './src/init.js';
import { prompts } from './src/prompts.js';
import { queryPackage } from './src/utils.js';
import { Command } from 'commander';
import { generateOptions } from './src/utils.js';

import * as url from 'url';
const __version = '1.0.0';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

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
if (options.set !== 'latest') {
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
	const quickstart = await inquirer.prompt(prompts.quickstart);

	let customizations = {
		filters: [],
		shortcodes: [],
		collections: [],
		markdownPlugins: [],
		pages: [],
	};
	let bundles = { selected: [] };
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
	if (quickstart.answer) {
		for (let bundle of generateOptions(path.join(__dirname, '/lib/addons/bundles/'))) {
			const bundlePrompt = await inquirer.prompt({
				type: 'confirm',
				name: 'answer',
				message: `Use the ${bundle.name} bundle?`,
				default: true,
			});
			if (bundlePrompt.answer) {
				bundles.selected.push(bundle.name);
			}
		}
	} else {
		customizations = await inquirer.prompt(prompts.customizations);
		const configureAdvanced = await inquirer.prompt(prompts.configureAdvanced);
		if (configureAdvanced.answer) {
			properties = await inquirer.prompt(prompts.properties);
			const configureAssets = await inquirer.prompt(prompts.configureAssets);
			if (configureAssets.answer) {
				assets = await inquirer.prompt(prompts.assets);
			}
		}
	}

	const answers = {
		project: project.name,
		bundles: bundles.selected,
		...customizations,
		pages: customizations.pages,
		properties: properties,
		assets: assets,
	};
	generateProject(answers, options);
}

run();
