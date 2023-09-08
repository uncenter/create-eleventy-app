#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import kebab from 'just-kebab-case';
import semver from 'semver';

import { confirm, input, select } from '@inquirer/prompts';
import { Command, Option } from 'commander';
import { generateProject } from './src/init.js';
import { alreadyExists, queryPackage } from './src/utils.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const program = new Command();
program
	.version(
		JSON.parse(await fs.readFile(path.join(__dirname, 'package.json'))).version,
	)
	.option('-v, --verbose', 'print verbose output', false)
	.option('-s, --silent', 'silence all output', false)
	.option('-e, --set <version>', 'use a specific version of Eleventy', 'latest')
	.addOption(
		new Option(
			'-i, --install <package-manager>',
			'install dependencies using specified package manager',
		)
			.choices(['npm', 'yarn', 'pnpm'])
			.default('npm'),
	);

program.parse(process.argv);
let options = program.opts();
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
	const project = await input({
		message: 'What is your project named?',
		default: 'my-project',
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
		configFile:
			options.set === 'latest' ||
			options.set === 'next' ||
			semver.gte(options.set, '2.0.0')
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
		properties = {
			configFile: await select({
				message: 'Set Eleventy config file path?',
				choices: [
					{
						value: 'eleventy.config.js',
					},
					{
						value: 'eleventy.config.cjs',
					},
					{
						value: '.eleventy.js',
					},
				],
				default: properties.configFile,
				when: () => {
					return (
						options.set === 'latest' ||
						options.set === 'next' ||
						semver.gte(options.set, '2.0.0')
					);
				},
			}),
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
				img: await input({ message: 'Set images directory?', default: 'img' }),
				js: await input({ message: 'Set scripts directory?', default: 'js' }),
				css: await input({ message: 'Set styles directory?', default: 'css' }),
			};
		}
	}

	const answers = {
		project: kebab(project),
		...customizations,
		properties: properties,
		assets: assets,
	};
	await generateProject(answers, options);
}

run();
