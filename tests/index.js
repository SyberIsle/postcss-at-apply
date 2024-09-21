const postcss = require('postcss'),
      test    = require('tape'),
      apply   = require('../index')

function pluginTest(t, payload, expected)
{
	t.equal(postcss(apply).process(payload).css.trim(), expected);
}

test('without dot', (t) => {
	pluginTest(t, '.a{color:blue;} .b{@apply a}', '.a{color:blue;} .b{color:blue}')
	t.end();
});

test('with dot', (t) => {
	pluginTest(t, '.a{color:blue;} .b{@apply .a;}', '.a{color:blue;} .b{color:blue;}')
	t.end();
});

test('multi selector', (t) => {
	pluginTest(
		t,
		'.a{color:blue} .b{background:red} .c{@apply .a b}',
		'.a{color:blue} .b{background:red} .c{color:blue;background:red}'
	)
	t.end();
});

test('warning on missing', t => {
	const ps = postcss(apply({debug: true})).process('.a{@apply z kakaw b} .b{color:blue}');
	for (const w of ps.warnings()) {
		// we can't rely on indexOf due to CLI colorization
		t.notEqual(-1, w.text.indexOf("Rule not found in css"), 'has "Rule not found in css"');
	}

	t.equal(ps.css.trim(), '.a{color:blue} .b{color:blue}');
	t.end();
});