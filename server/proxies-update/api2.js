//@ts-check

let http = require('request'),
	config = require('../../config.server');

const APIName = 'customURL';

module.exports = { get };

/**
 * @returns {Promise<string[]>}
 */
function get() { 
	return new Promise(resolve => 
		http(config.proxiesUpdateURL, { }, (err, response, body) => {
			if (err) {
				printError(`code: ${err.code} message: ${err.message}`);
				return resolve([]);
			}
			if (response && response.statusCode != 200) { 
				printError(`response: ${response.statusCode} ${response.statusMessage}`);
				return resolve([]);
			}
			
			let result = String(body)
				.split(/[\n\r]+/)
				.map(l => l.trim())
				.filter(l => l)
				.map(l => (l.startsWith('http://') || l.startsWith('https://')) ? l : `http://${l}`)
			// console.log(result);
			console.log(`Get ${result.length} proxies (${APIName})`);
			return resolve(result);
		}));
	function printError(reason) { 
		console.error(`Error: ${reason} (${APIName})`)
	}	
}
