#!/usr/bin/env node

import * as packageJson from '../package.json' with { type: 'json' };
import { getPackageManager, log, PACKAGE_MANAGERS } from './constants.js';
import { generateProject } from './init.js';
import { alreadyExists, queryPackage } from './utils.js';

import { confirm, input, select } from '@inquirer/prompts';
import { Command, Option } from 'commander';
import kebab from 'just-kebab-case';
import semver from 'semver';
import detectPackageManager from 'which-pm-runs';

const program = new Command();
program
	.version(packageJson.version)
	.option('-v, --verbose', 'print verbose output', false)
	.option('-s, --silent', 'silence all output', false)
	.option('-e, --set <version>', 'use a specific version of Eleventy', 'latest')
	.addOption(
		new Option(
			'-i, --install <package-manager>',
			'install dependencies using specified package manager',
		)
			.choices(PACKAGE_MANAGERS)
			.default(detectPackageManager()?.name || getPackageManager().name),
	);

program.parse(process.argv);
const options = program.opts();
if (options.verbose && options.silent) {
	log.error('You cannot use both --verbose and --silent.');
	process.exit(1);
}

const npmPackage = await queryPackage('@11ty/eleventy');
const versionByDistributionTag = npmPackage.distributionTags[options.set];
// If there is no version by the distribution tag, check if the version exists in the versions list.
if (!(versionByDistributionTag || npmPackage.versions.includes(options.set))) {
	log.error(
		`@11ty/eleventy@${options.set} does not exist. Please use a valid version number (latest: ${npmPackage.distributionTags.latest}) or valid distribution tag (${Object.keys(npmPackage.distributionTags).join(', ')}).`,
	);
	process.exit(1);
}
const resolvedVersion = versionByDistributionTag || options.set;
const supportsVersion2 = semver.gte(resolvedVersion, '2.0.0');
const supportsVersion3 = supportsVersion2 && semver.gte(resolvedVersion, '3.0.0');
const isTooNew = supportsVersion3 && semver.major(resolvedVersion) > 3;

if (isTooNew) {
	log.error(
		`The version of Eleventy you are trying to use (${resolvedVersion}) is too new for this version of create-eleventy-app. Please update create-eleventy-app or open an issue at https://github.com/uncenter/create-eleventy-app/issues.`,
	);
	process.exit(1);
}

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

const customizations = {
	filters: ['htmlDateString', 'readableDate'],
	shortcodes: [],
	collections: [],
};

let properties = {
	esModule: supportsVersion3,
	configFile: supportsVersion2 ? 'eleventy.config.js' : '.eleventy.js',
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
	const esModule = supportsVersion3
		? await confirm({
				message: 'Use ECMAScript modules syntax (ESM) in JavaScript files?',
				default: true,
			})
		: properties.esModule;
	properties = {
		esModule,
		configFile: supportsVersion2
			? await select({
					message: 'Set Eleventy configuration file path?',
					choices: [
						{
							value: 'eleventy.config.js',
						},
						esModule
							? {
									value: 'eleventy.config.mjs',
								}
							: {
									value: 'eleventy.config.cjs',
								},
						{
							value: '.eleventy.js',
						},
					],
					default: properties.configFile,
				})
			: '.eleventy.js',
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

	supportsVersion2,
	supportsVersion3,
};
await generateProject(answers, options);
