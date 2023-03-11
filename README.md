# create-eleventy-app

A CLI tool to create a new Eleventy site (in development).

## To-do
Roughly in order of priority:

- [ ] Add more plugins (with configuration), shortcodes, filters, collections
- [ ] Assets handling configuration?
    - Currently it just creates `css`, `img`, and `js` directories in the input directory. Add multiple options for this such as an assets directory (`src/assets`), or a directory for each asset type (`src/css`, `src/img`, `src/js`).
- [ ] Implement Tailwind and SASS support
    - Edit package.json scripts for this purpose?
- [ ] Add complete starter projects
    - [ ] Minimal
    - [ ] Blog
    - [ ] Docs
    - [ ] Notes
- [ ] Improve bundles and add new ones
- [ ] Remove duplicate imports from config file
    - Filters, shortcodes, and collections provide their own imports, but some may already be imported in the config file (e.g. markdown-it)
- [ ] Clean up wording of prompts

Little things:
- [ ] Change paths in the generated README to match the user's input in the prompts
---

## Installation

NOT YET PUBLISHED

```sh
npm install -g create-eleventy-app
```