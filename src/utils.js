import fs from 'node:fs/promises';
import path from 'node:path';

import { dirname } from './constants.js';

const __dirname = dirname(import.meta.url);

export async function alreadyExists(pathString) {
	try {
		const stats = await fs.stat(pathString);
		if (stats.isFile()) return true;
		return (await fs.readdir(pathString)).length !== 0;
	} catch {
		return false;
	}
}

async function findFile(filename, parentDirectory) {
	const files = await fs.readdir(parentDirectory);
	for (let file of files) {
		const stat = await fs.stat(path.join(parentDirectory, file));
		if (stat.isDirectory()) {
			const result = await findFile(filename, path.join(parentDirectory, file));
			if (result) return result;
		} else if (file === filename) {
			return path.join(parentDirectory, file);
		}
	}
	return false;
}

export async function addAddon(addonName) {
	const file = await findFile(
		addonName + '.js',
		path.join(__dirname, '..', './lib/addons'),
		'utf8',
	);
	let addon = await fs.readFile(file, 'utf-8');
	const imports = addon.match(/const\s+.*\s*=\s*require\(['"].*['"]\);/g);
	if (imports) {
		for (let imp of imports) {
			addon = addon.replace(imp, '');
		}
	}
	const func = addon;
	return { imports, func };
}

export async function queryPackage(pkg, version = null) {
	const res = await fetch(
		`https://registry.npmjs.org/${pkg}${version ? '/' + version : ''}`,
	);
	const { name, description, versions } = await res.json();
	return {
		name: name,
		description: description,
		version: Object.keys(versions).at(-1),
		versions: Object.keys(versions),
	};
}
