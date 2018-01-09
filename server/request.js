//@ts-check

let http = require('request'),
	proxies = require('./proxies'),
	config = require('../config.server');

const API = "https://steamcommunity.com/market/priceoverview/";
const HEADERS = {
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
};

module.exports = { request };

/** @returns {Promise<{status: number; body: string}>} */
function request(qs) { return _request(qs, proxies.getRandomProxyId(), 0); }

/**
 * @param {any} qs 
 * @param {number} proxyId 
 * @param {number} retryTimes 
 * @returns {Promise<{status: number; body: string}>}
 */
function _request(qs, proxyId = 0, retryTimes = 0) { 
	let name = qs.market_hash_name;
	let proxy = proxies.getProxy(proxyId);
	// console.log(`Requesting "${name}" proxy by ${proxy}(id: ${proxyId}) ...`);

	return new Promise((resolve, reject) => {
		let hasResponse = false;
		let timeout = setTimeout(response, config.timeout,
			{code: 'ETIMEOUT', message: `more than ${config.timeout} ms`});

		http(API, {
			qs, proxy, headers: HEADERS, // timeout: config.timeout
		}, response);
	
		function response(err, response, body) {
			if (hasResponse) return;//avoid dumplicated response
			hasResponse = true;

			if (!err && response && response.statusCode != 429) {
				console.log(`Success: ${response.statusMessage} (name: "${name}", proxy: ${proxy})`);
				return resolve({ status: response.statusCode, body });
			}
			
			if (err) {
				proxies.cleanInvalidPreferredProxy(proxyId);
				if (err.code == 'ECONNRESET')
					printError(`code: ECONNRESET`);
				else
					printError(`code: ${err.code || 'unknown'}  message: ${err.message || err}`);
			}
			if (response && response.statusCode == 429) {
				printError('429 Too Many Requests');
			}
			
			let maxRetryTimes = Math.min(config.maxRetryTimes, proxies.getProxyCount());
			if (++retryTimes < maxRetryTimes) {
				let nextProxy = proxies.getNextProxyId(proxyId);
				return _request(qs, nextProxy, retryTimes).then(resolve).catch(reject);
			}

			reject(new Error(`Could not get price info! (retry times: ${retryTimes})`));
		}
	});

	function printError(reason) { 
		console.error(`Error: ${reason} (name: "${name}", proxy: ${proxy})`)
	}
}
