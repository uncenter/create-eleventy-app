import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function alreadyExists(pathString) {
	try {
		const stats = await fs.stat(pathString);
		if (stats.isFile()) {
			return true;
		} else if (stats.isDirectory()) {
			if ((await fs.readdir(pathString).length) === 0) {
				return false;
			} else {
				return true;
			}
		}
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

export async function queryPackage(packageName, version = null) {
	const res = await fetch(
		`https://registry.npmjs.org/${packageName}${version ? '/' + version : ''}`,
	);
	const data = await res.json();
	function getLatestVersion() {
		const versions = Object.keys(data.versions);
		return versions[versions.length - 1];
	}
	function getAllVersions() {
		return Object.keys(data.versions);
	}
	return {
		name: data.name,
		description: data.description,
		version: getLatestVersion(),
		versions: getAllVersions(),
	};
}
