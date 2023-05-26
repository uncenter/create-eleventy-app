#!/usr/bin/env node --no-warnings

import inquirer from 'inquirer';
import lodash from 'lodash';
import updateNotifier from 'update-notifier';
import packageJson from './package.json' assert { type: 'json' };
import semver from 'semver';

import { generateProject } from './src/init.js';
import { queryPackage, dirExists } from './src/utils.js';
import { Command, Option } from 'commander';

const __version = packageJson.version;

updateNotifier({
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
}).notify();

const program = new Command();
program
	.version(__version)
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
	const project = await inquirer.prompt({
		type: 'input',
		name: 'name',
		message: 'What is your project named?',
		default: 'my-project',
		validate: (input) => {
			if (dirExists(input)) {
				return 'A directory with that name already exists.';
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

	const configureAdvanced = await inquirer.prompt({
		type: 'confirm',
		name: 'answer',
		message: 'Configure advanced properties?',
		default: false,
	});
	if (configureAdvanced.answer) {
		properties = await inquirer.prompt([
			{
				type: 'list',
				name: 'configFile',
				message: 'Set Eleventy config file path?',
				choices: ['eleventy.config.js', 'eleventy.config.cjs', '.eleventy.js'],
				default: properties.configFile,
				when: () => {
					return (
						options.set === 'latest' ||
						options.set === 'next' ||
						semver.gte(options.set, '2.0.0')
					);
				},
			},
			{
				type: 'input',
				name: 'output',
				message: 'Set output directory?',
				default: 'dist',
			},
			{
				type: 'input',
				name: 'input',
				message: 'Set input directory?',
				default: 'src',
			},
			{
				type: 'input',
				name: 'data',
				message: 'Set data directory?',
				default: '_data',
			},
			{
				type: 'input',
				name: 'includes',
				message: 'Set includes directory?',
				default: '_includes',
			},
		]);
		const configureAssets = await inquirer.prompt({
			type: 'confirm',
			name: 'answer',
			message: 'Configure assets directory?',
			default: false,
		});
		if (configureAssets.answer) {
			assets = await inquirer.prompt([
				{
					type: 'input',
					name: 'parent',
					message: 'Set parent assets directory?',
					default: 'assets',
				},
				{
					type: 'input',
					name: 'img',
					message: 'Set images directory?',
					default: 'img',
				},
				{
					type: 'input',
					name: 'js',
					message: 'Set scripts directory?',
					default: 'js',
				},
				{
					type: 'input',
					name: 'css',
					message: 'Set styles directory?',
					default: 'css',
				},
			]);
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
