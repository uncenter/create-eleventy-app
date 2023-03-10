# create-eleventy-app

A CLI tool to create a new Eleventy site (in development).

## To-do
- [ ] Add complete starter projects
- [ ] Implement Tailwind and SASS support
    - Edit package.json scripts for this purpose?
- [ ] Remove duplicate imports from config file
    - Filters, shortcodes, and collections provide their own imports, but some may already be imported in the config file (e.g. markdown-it)
- [ ] Clean up wording of prompts
- [ ] Assets handling configuration?
    - Currently I just create `css`, `img`, and `js` directories in the input directory. Add multiple options for this such as an assets directory (`src/assets`), or a directory for each asset type (`src/css`, `src/img`, `src/js`).
---

## Installation

NOT YET PUBLISHED

```sh
npm install -g create-eleventy-app
```