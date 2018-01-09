//@ts-check

require('should');

let { request: requestPriceInfo } = require('../server/request');

describe('test request price info by invoking function', () => {
	it('# request success', () =>
		requestPriceInfo(generateRequestQuery('762800-:2017eyeball:'))
			.then(({ status, body }) => {
				console.log(status, body);

				/** @type {{[x: string]: any}} */
				let obj = JSONParse(body, false);

				status.should.be.equal(200);
				obj.should.be.ok()
					.and.has.keys('success', 'lowest_price', 'median_price')
					.and.property('success', true);
				
				return Promise.resolve(true);
			}));
});

function JSONParse(json, defaultValue) { 
	try { return JSON.parse(json); }
	catch (ex) { return defaultValue; }
}

function generateRequestQuery(marketHashName = '') { 
	return {
		country: 'CN',
		currency: 23,
		appid: 753,
		market_hash_name: marketHashName
	};
}
