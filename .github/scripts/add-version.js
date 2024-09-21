const fs = require('fs');
const pj = require(`${process.cwd()}/package.json`);

let version = process.env.GITHUB_REF.split('/').pop();
version     = version.startsWith('v') ? version.substring(1) : version;

if (pj.version !== version) {
	pj.version = version;
	fs.writeFile(`${process.cwd()}/package.json`, JSON.stringify(pj, null, 2), 'utf8', (err) => {
		if (err) {
			throw err;
		}
	});
}

