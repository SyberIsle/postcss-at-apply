# @syberisle/postcss-at-apply

[PostCSS](https://postcss.org/) plugin that allows you to use `@apply` similar to Tailwind CSS.

# Installation

```shell
npm install --save-dev @syberisle/postcss-at-apply
```

Add to your plugins list
```javascript
module.exports = {
	plugins: {
		"@syberisle/postcss-at-apply": {}
    }
}
```

# Usage

```scss
.a { color: red; }
.b { background: blue !important; }
.c { @apply a b; }
.d { @apply !a; }
```

Results:
```css
.a { color: red; }
.b { background: blue !important; }
.c { color: red; background: blue; }
.d { color: red !important; }
```

You can prefix `!` to a selector in `@apply` to have `!important` added to it, otherwise `!important` is removed.

You may add `!important` to the end of `@apply`, and it will be applied to all rules.
