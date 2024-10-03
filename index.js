/**
 * @type {import('postcss').PluginCreator}
 */
const pico = require('picocolors')

module.exports = () => {
	return {
		postcssPlugin: 'postcss-at-apply',
		Once(root, {result})
		{
			const cache     = new Map;
			const map       = new Map;
			const need      = new Set;
			const recursion = new Set;
			const seen      = new Set;

			root.walkAtRules('apply', atRule => {
				atRule.parent.selectors.forEach(selector => { !map.has(selector) && map.set(selector, new Set); });
				atRule.params.replace(' !important', '').split(/[\s\t\n]+/g).forEach(name => {
					atRule.parent.selectors.forEach(key => {
						map.get(key).add(name.startsWith('.') ? name : `.${name}`)
					});
				})
			});

			map.forEach((_, key) => scanForRecursion(key, seen));
			map.forEach(value => value.forEach(need.add, need));
			root.walkRules(child => {
				for (let selector of child.selectors.filter(x => need.has(x))) {
					cache[selector] = child;
				}
			});

			// we didn't cache the atRule... maybe we should have?
			root.walkAtRules('apply', (atRule) => {
				const rules = new Set;
				for (let name of atRule.params.replace(' !important', '').split(/[\s\t\n]+/g)) {
					let selector = name.startsWith('.') ? name : `.${name}`;
					if (selector in cache) {
						for (let node of cache[selector].nodes) {
							rules.add(node.clone());
						}
					}
					else if (recursion.has(`${atRule.parent.selector}-${selector}`)) {
						result.warn(warningHighlight(atRule, name, 'Circular reference detected', 'circular reference'));
					}
					else {
						result.warn(warningHighlight(atRule, name, 'Rule not found in css', 'not found'));
					}
				}

				let parent = atRule.parent;
				atRule.replaceWith(...rules);
				if (!parent.nodes || parent.nodes.length === 0) {
					// should a warning be emitted that we removed the parent?
					parent.remove();
				}
			});

			function scanForRecursion(selector, seen)
			{
				if (seen.has(selector)) {
					return true;
				}

				seen.add(selector);
				for (let applySelector of (map.get(selector) || [])) {
					if (scanForRecursion(applySelector, new Set(seen))) {
						map.get(selector).delete(applySelector);
						recursion.add(`${selector}-${applySelector}`);
						return true;
					}
				}

				return false;
			}
		}
	};
};

/**
 * @param {Rule}   rule          The rule to use for formatting
 * @param {string} search       The string to search for
 * @param {string} description Describe the warning
 * @param {string} message      Message for the arrow highlight
 *
 * @returns {string} The formatted warning
 */
function warningHighlight(rule, search, description, message)
{
	const re    = new RegExp("\\b" + search + "\\b");
	const match = rule.params.match(re);
	if (!match) {
		return '';
	}

	return [
		pico.reset(''),
		pico.yellow("WARNING: ") + description,
		'',
		pico.blue(' | ') + (rule.source.input.file || rule.source.input.css),
		pico.blue(` | ${rule.parent.selector} {`),
		pico.blue(' |   @apply ') + rule.params.replace(re, pico.red(search)),
		pico.blue(' |          ') + ' '.repeat(match.index) + pico.red('^'.repeat(search.length) + ` ${message}`),
		pico.blue(` | }`),
	].join('\n');
 }

module.exports.postcss = true;
