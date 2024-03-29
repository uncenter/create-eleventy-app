# create-eleventy-app

A simple CLI for creating an Eleventy project in seconds.

## Usage

```sh
npx create-eleventy-app@latest
pnpm dlx create-eleventy-app@latest
bunx create-eleventy-app@latest
```

### Options

#### `--silent`, `-s`

Silence the output of the CLI.

#### `--verbose`, `-v`

Show verbose output of the CLI.

#### `--install <package-manager>`, `-i <package-manager>`

Specify the package manager to use for installing dependencies. Defaults to the auto-detected package manager used for running `create-eleventy-app` or `npm`, but can be set to `yarn`, `pnpm`, `bun`, or `npm`.

#### `--set <version>`, `-e <version>`

Set the version of Eleventy to install.

## Credits

Thanks to [Brett Jankord's `create-eleventy-site`](https://github.com/bjankord/create-eleventy-site) for the design of the start page.

## License

[MIT](./LICENSE)
