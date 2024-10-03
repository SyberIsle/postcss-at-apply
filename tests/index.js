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
		t.ok(w.text.includes("Rule not found in css"), 'has "Rule not found in css" warning');
	}

	t.equal(ps.css.trim(), '.a{color:blue} .b{color:blue}', '.a contains .b');
	t.end();
});

test('group of selectors', t => {
	const ps = postcss(apply({debug: true})).process('.a, .c {color:red} .b{@apply a}');
	t.equal(ps.css.trim(), '.a, .c {color:red} .b{color:red}', 'contains .a');
	t.end();
});

test('group of selector with non-class prefix ', t => {
	const ps = postcss(apply({debug: true})).process('div.a {color:blue} .a, .c {color:red} .b{@apply a}');
	t.equal(ps.css.trim(), 'div.a {color:blue} .a, .c {color:red} .b{color:red}', 'contains .a');
	t.end();
});

test('rule selector with > ', t => {
	const ps = postcss(apply({debug: true})).process('.a, .c {color:red} div > .a {color:blue} .b{@apply a}');
	t.equal(ps.css.trim(), '.a, .c {color:red} div > .a {color:blue} .b{color:red}', 'contains .a');
	t.end();
});


test('skips reference to self', t => {
	const ps = postcss(apply({debug: true})).process('.a, .c {color:red} .b{@apply a b}');
	for (const w of ps.warnings()) {
		t.ok(w.text.includes('Circular reference detected'), 'has "Circular reference detected" warning');
	}
	t.equal(ps.css.trim(), '.a, .c {color:red} .b{color:red}', 'contains .a');
	t.end();
});

test('skips reference to self', t => {
	const ps = postcss(apply({debug: true})).process('.z { @apply a b } .a, .c {color:red} .b { @apply z }');
	let i = 0;
	for (const w of ps.warnings()) {
		// there should be 2 of these
		i++;
		t.ok(w.text.includes('Circular reference detected'), 'has "Circular reference detected" warning');
	}
	t.equal(2, i, "found 2 warnings");
	t.equal(ps.css.trim(), '.z {color:red} .a, .c {color:red}', 'missing .b');
	t.end();
});