#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import kebab from 'just-kebab-case';
import semver from 'semver';
import detectPackageManager from 'which-pm-runs';

import { confirm, input, select } from '@inquirer/prompts';
import { Command, Option } from 'commander';

import { generateProject } from './src/init.js';
import { alreadyExists, queryPackage } from './src/utils.js';
import {
	dirname,
	log,
	packageManager,
	packageManagers,
} from './src/constants.js';

const __dirname = dirname(import.meta.url);

const program = new Command();
program
	.version(
		JSON.parse(
			await readFile(path.join(__dirname, 'package.json'), 'utf-8'),
		).version,
	)
	.option('-v, --verbose', 'print verbose output', false)
	.option('-s, --silent', 'silence all output', false)
	.option(
		'-e, --set <version>',
		'use a specific version of Eleventy',
		'latest',
	)
	.addOption(
		new Option(
			'-i, --install <package-manager>',
			'install dependencies using specified package manager',
		)
			.choices(packageManagers)
			.default(detectPackageManager()?.name || packageManager().name),
	);

program.parse(process.argv);
let options = program.opts();
if (options.verbose && options.silent) {
	log.error('You cannot use both --verbose and --silent.');
	process.exit(1);
}

const npmPackage = await queryPackage('@11ty/eleventy');
if (!npmPackage.versions.includes(options.set)) {
	log.error(
		`@11ty/eleventy@${options.set} does not exist. Please use a valid version number (latest: ${npmPackage.version}).`,
	);
	process.exit(1);
}
const resolvedVersion = options.set === 'latest' || options.set === 'next'
	? npmPackage.version
	: options.set;
const isVersion2 = semver.gte(resolvedVersion, '2.0.0');
const isVersion3 = isVersion2 && semver.gte(resolvedVersion, '3.0.0');

const project = await input({
	message: 'What is your project named?',
	default: 'my-11ty-project',
	validate: async (input) => {
		if (await alreadyExists(input)) {
			return 'A file or directory with that name already exists.';
		}
		if (input.trim() === '') {
			return 'Please enter a project name.';
		}
		return true;
	},
});

let customizations = {
	filters: ['htmlDateString', 'readableDate'],
	shortcodes: [],
	collections: [],
};

let properties = {
	esModule: isVersion3 ? true : false,
	configFile:
		isVersion2
			? 'eleventy.config.js'
			: '.eleventy.js',
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

if (
	await confirm({
		message: 'Configure advanced properties?',
		default: false,
	})
) {
	const esModule = isVersion3 ? await confirm({
			message: 'Use ECMAScript modules syntax (ESM) in JavaScript files?',
			default: true,
		}) : properties.esModule;
	properties = {
		esModule,
		configFile: isVersion2 ? await select({
			message: 'Set Eleventy configuration file path?',
			choices: [
				{
					value: 'eleventy.config.js',
				},
				esModule ? {
					value: 'eleventy.config.mjs',
				} : {
					value: 'eleventy.config.cjs',
				},
				{
					value: '.eleventy.js',
				},
			],
			default: properties.configFile,
		}) : '.eleventy.js',
		output: await input({
			message: 'Set output directory?',
			default: 'dist',
		}),
		input: await input({ message: 'Set input directory?', default: 'src' }),
		data: await input({ message: 'Set data directory?', default: '_data' }),
		includes: await input({
			message: 'Set includes directory?',
			default: '_includes',
		}),
	};
	if (
		await confirm({
			message: 'Configure assets directory?',
			default: false,
		})
	) {
		assets = {
			parent: await input({
				message: 'Set parent assets directory?',
				default: 'assets',
			}),
			img: await input({
				message: 'Set images directory?',
				default: 'img',
			}),
			js: await input({
				message: 'Set scripts directory?',
				default: 'js',
			}),
			css: await input({
				message: 'Set styles directory?',
				default: 'css',
			}),
		};
	}
}

const answers = {
	project: kebab(project),
	...customizations,
	properties: properties,
	assets: assets,

	isVersion2,
	isVersion3,
};
await generateProject(answers, options);
