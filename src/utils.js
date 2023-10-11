import fs from 'node:fs/promises';
import path from 'node:path';

import { dirname } from './constants.js';

const __dirname = dirname(import.meta.url);

export async function alreadyExists(p) {
	try {
		const stats = await fs.stat(p);
		if (stats.isFile()) return true;
		const files = await fs.readdir(p);
		return files.length > 0;
	} catch {
		return false;
	}
}

async function findFile(filename, parent) {
	const files = await fs.readdir(parent);
	for (let file of files) {
		const stat = await fs.stat(path.join(parent, file));
		if (stat.isDirectory()) {
			const result = await findFile(filename, path.join(parent, file));
			if (result) return result;
		} else if (file === filename) {
			return path.join(parent, file);
		}
	}
	return false;
}

export async function addAddon(name) {
	const file = await findFile(
		name + '.js',
		path.join(__dirname, '..', './lib/addons'),
		'utf8',
	);
	let addon = await fs.readFile(file, 'utf-8');
	const imports = addon.match(/const\s+.*\s*=\s*require\(["'].*["']\);/g);
	if (imports) {
		for (let imp of imports) {
			addon = addon.replace(imp, '');
		}
	}
	return { imports, func: addon };
}

export async function queryPackage(pkg, version) {
	const response = await fetch(
		`https://registry.npmjs.org/${pkg}${version ? '/' + version : ''}`,
	);
	const { name, description, versions } = await response.json();
	return {
		name: name,
		description: description,
		version: Object.keys(versions).at(-1),
		versions: Object.keys(versions),
	};
}
