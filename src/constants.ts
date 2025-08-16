import { fileURLToPath } from 'node:url';
export const dirname = (x) => fileURLToPath(new URL('.', x));

import { Logger } from 'loogu';
export const log = new Logger('', { throwError: false });

export const packageManagers = ['npm', 'yarn', 'pnpm', 'bun'];
export const packageManager = (pm) => {
	switch (pm) {
		case 'yarn': {
			return {
				name: 'yarn',
				run: 'yarn run',
				install: 'yarn add',
			};
		}
		case 'pnpm': {
			return {
				name: 'pnpm',
				run: 'pnpm run',
				install: 'pnpm add',
			};
		}
		case 'bun': {
			return {
				name: 'bun',
				run: 'bun run',
				install: 'bun add',
			};
		}
		default: {
			return {
				name: 'npm',
				run: 'npm run',
				install: 'npm install',
				default: true,
			};
		}
	}
};
