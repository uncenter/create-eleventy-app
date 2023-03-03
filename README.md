# create-eleventy-app

A CLI tool to create a new Eleventy site.

## To-do

### Templates

- [ ] Base
- [ ] Base + Sass
- [ ] Base + Tailwind
- [ ] Base + Tailwind + Sass

### Addons

#### Packs
- [ ] Blog
- [ ] Comments
- [ ] Dates

#### Templates
- [ ] Blog

---

## Installation

```sh
npm install -g create-eleventy-app
```

## Usage

```sh
npx create-eleventy-app <project-name>
```

## Templates

### `--base`

The base template to use. Based on `eleventy-base-blog` and 11ty documentation.

### `--tailwind`

Adds Tailwind CSS to the project.

### `--sass`

Adds Sass to the project.

### `--tailwind-sass`

Adds Tailwind CSS and Sass to the project.

## Pre-made addons (**templates**, filters, shortcodes, etc.)

### `--blog`

Adds a blog template and filters to the project.

### `--base`

Just the base template.

## Custom addons (filters, shortcodes, etc.)

### `--blog`

Adds blog filters and shortcodes to the project.

### `--comments`

Adds comments shortcodes to the project. Currently only [Giscus](https://giscus.app/) is supported.

### `--dates` 

Adds date filters to the project.

