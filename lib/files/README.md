# Create Eleventy App

This is a starter template for [Eleventy](https://www.11ty.dev/).

## Getting Started

### Start the development server

```sh
npm run start
```

### Build the site for production

```
npm run build
```

For more information, see the [Eleventy documentation](https://www.11ty.dev/docs/).

## Customizing

### Adding a new page

To add a new page, create a new file in the `src` directory. For example, to create a new page at `/about`, create a file at `src/about.md`.

### Adding a new layout

To add a new layout, create a new file in the `src/_includes` directory. For example, to create a new layout for posts, create a file at `src/_includes/post.njk`.

### Modifying the site metadata

To modify the site metadata, edit the `src/_data/site.json` file. For example, to change the site title, edit the `title` property. Feel free to add or remove any properties you don't need. To use a property in a template, use the `site` variable. For example, to use the site title in a template, use `{{ site.title }}` (Nunjucks syntax).


## Resources

- [Eleventy documentation](https://www.11ty.dev/docs/)
- Eleventy community on [Discord](https://discord.gg/GBkBy9u)

### Community projects

- [eleventy-template-bliss](https://github.com/offbeatbits/eleventy-template-bliss)
    - Single-column blog template for Eleventy focused on simplicity without sacrificing functionality.
- [eleventy-base-blog](https://github.com/11ty/eleventy-base-blog)
    - A starter repository for a blog web site using the Eleventy static site generator. 
- [111ty](https://github.com/danfascia/111ty)
    - Nice baseline starter with TailwindCSS, SEO and Inline JS from Unpkg 
- [eleventy-excellent](https://github.com/madrilene/eleventy-excellent)
    - Opinionated Eleventy starter based on the workflow suggested by Andy Bell's buildexcellentwebsit.es. 
- [eleventy-notes](https://github.com/rothsandro/eleventy-notes)
    - A template for Eleventy to publish your personal notes or docs.