/**
 * @type {import('postcss').PluginCreator}
 */
const pico = require('picocolors')

module.exports = () => {
	let cache = {}
	return {
		postcssPlugin: 'postcss-at-apply',
		AtRule: {
			apply: (rule, {result}) => {
				const classes = rule.params
					.replace(' !important', '')
					.split(/[\s\t\n]+/g);
				const root = rule.root();
				const rules = new Set();
				for (let name of classes) {
					let orig = name
					name = name.startsWith('.') ? name : `.${name}`;
					if (!(name in cache)) {
						root.walkRules(name, rule => cache[name] = rule);
					}

					if (name in cache) {
						for (const node of cache[name].nodes) {
							rules.add(node.toString());
						}
					} else {
						result.warn(warningHighlight(rule, orig));
					}
				}
				if (rules.size > 0) {
					rule.replaceWith(...rules);
				}
			}
		}
	};
};

/**
 * @param {Rule}   rule    The rule to use for formatting
 * @param {string} search The string to search for
 *
 * @returns {string} The formatted warning
 */
function warningHighlight(rule, search) {
	// there is a possibility it's at the end of the
	let re = new RegExp("\\b" + search + "\\b");
	const idx = rule.params.match(re);
	if (!idx) {
		return '';
	}
	let size = ' '.repeat(rule.source.start.line.toString().length);

	return [
		'',
		pico.yellow("WARNING: ") + `Rule not found in css`,
		'',
		pico.blue(` ${size} | `) + (rule.source.input.file || rule.source.input.css),
		pico.blue(` ${rule.source.start.line} | `)
		+ `@apply ${rule.params.replace(re, pico.red(search))}`,
		pico.blue(` ${size} | `)
		+ '       ' + ' '.repeat(idx.index) + pico.red('^'.repeat(search.length) + ' not found')
	].join('\n');
}

module.exports.postcss = true;
