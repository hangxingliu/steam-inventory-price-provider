//@ts-check

require('should');

let fs = require('fs'),
	{ get, parse } = require('../server/proxies-update/api1');

const TEST_HTML = 'resources/index1.shtml';
const TEST_ABS_PATH = `${__dirname}/${TEST_HTML}`;

describe('test proxies update api1', () => {
	
	it(`# parse ${TEST_HTML}`, function () {
		if (!fs.existsSync(TEST_ABS_PATH))
			return this.skip();
		
		let result = parse(fs.readFileSync(TEST_ABS_PATH, 'utf8'));
		result.should.be.an.Array().and.not.empty();
		console.log(result);
	});

	it(`# get proxies online`, function() {
		this.skip();
		this.slow(5000);
		this.timeout(8000);
		return get().then(ips => console.log(ips));
	});
});