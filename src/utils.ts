import fs from 'node:fs/promises';
import path from 'node:path';

import { dirname } from './constants.js';

const __dirname = dirname(import.meta.url);

export async function alreadyExists(p: string): Promise<boolean> {
	try {
		const stats = await fs.stat(p);
		if (stats.isFile()) return true;
		const files = await fs.readdir(p);
		return files.length > 0;
	} catch {
		return false;
	}
}

export async function addAddon(name: string): Promise<{ meta: { imports: [string, Array<string>] }; source: string }> {
	const addonDirectory = path.join(__dirname, '..', `./lib/addons/${name}`);
	let addonSource = await fs.readFile(path.join(addonDirectory, 'index.js'), 'utf-8');
	let addonMeta = JSON.parse(await fs.readFile(path.join(addonDirectory, 'meta.json'), 'utf-8'));
	return { meta: addonMeta, source: addonSource };
}

export async function queryPackage(pkg: string, version?: string) {
	const response = await fetch(
		`https://registry.npmjs.org/${pkg}${version ? '/' + version : ''}`,
	);
	const { name, description, versions, 'dist-tags': distributionTags } = await response.json();
	return {
		name,
		description,
		versions: Object.keys(versions),
		distributionTags,
	};
}
