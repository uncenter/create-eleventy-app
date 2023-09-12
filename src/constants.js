import { fileURLToPath } from 'node:url';
export const dirname = (x) => fileURLToPath(new URL('.', x));

import { Logger } from 'loogu';
export const log = new Logger('', { throwError: false });

export const packageManagers = {
	npm: {
		run: 'npm run',
		install: 'npm install',
		default: true,
	},
	yarn: {
		run: 'yarn run',
		install: 'yarn add',
	},
	pnpm: {
		run: 'pnpm run',
		install: 'pnpm add',
	},
};
