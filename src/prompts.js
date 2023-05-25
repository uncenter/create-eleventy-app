import { dirExists } from './utils.js';

const project = () => ({
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

const configureAdvanced = () => ({
	type: 'confirm',
	name: 'answer',
	message: 'Configure advanced properties?',
	default: false,
});

const properties = () => [
	{
		type: 'list',
		name: 'configFile',
		message: 'Set Eleventy config file path?',
		choices: ['eleventy.config.js', 'eleventy.config.cjs', '.eleventy.js'],
		default: 'eleventy.config.js',
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
];

const configureAssets = () => ({
	type: 'confirm',
	name: 'answer',
	message: 'Configure assets directory?',
	default: false,
});

const assets = () => [
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
];

export const prompts = {
	project: project(),
	configureAdvanced: configureAdvanced(),
	properties: properties(),
	configureAssets: configureAssets(),
	assets: assets(),
};
