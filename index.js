/**
 * @type {import('postcss').PluginCreator}
 */
const pico = require('picocolors')

module.exports = () => {
	let cache = {}
	return {
		postcssPlugin: 'postcss-at-apply',
		AtRule       : {
			apply: (rule, {result}) => {
				const classes = rule.params.replace(' !important', '').split(/[\s\t\n]+/g);
				const root    = rule.root();
				const rules   = new Set();
				for (let name of classes) {
					if (!(name in cache)) {
						root.walkRules(
							name.startsWith('.') ? name : `.${name}`,
							rule => cache[name] = rule
						);
					}

					if (name in cache) {
						for (const node of cache[name].nodes) {
							rules.add(node.toString());
						}
					}
					else {
						result.warn(warningHighlight(rule, name));
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
function warningHighlight(rule, search)
{
	const re = new RegExp("\\b" + search + "\\b");
	const match = rule.params.match(re);
	if (!match) {
		return '';
	}

	return [
		pico.reset() + '',
		pico.yellow("WARNING: ") + 'Rule not found in css',
		'',
		pico.blue(' | ') + (rule.source.input.file || rule.source.input.css),
		pico.blue(` | ${rule.parent.selector} {`),
		pico.blue(' |   @apply ') + rule.params.replace(re, pico.red(search)),
		pico.blue(' |          ') + ' '.repeat(match.index) + pico.red('^'.repeat(search.length) + ' not found'),
		pico.blue(` | }`),
	].join('\n');
}

module.exports.postcss = true;
