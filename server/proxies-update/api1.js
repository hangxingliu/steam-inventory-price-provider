//@ts-check

let cheerio = require('cheerio'),
	http = require('request');

const APIName = 'goubanjia';
const getURL = page => `http://www.goubanjia.com/free/gngn/index${parseInt(page)}.shtml`;
const MAX_PAGE = 3;
const headers = {
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
};

module.exports = { get, parse };

/** @returns {Promise<string[]>} */
function get() { 
	let result = [], page = 1;
	return new Promise(resolve => {
		_loop();

		function _loop() {
			if (page > MAX_PAGE)
				return resolve(result);
			return _get(page++)
				.then(r => result = result.concat(r))
				.then(() => sleep(1000))
				.then(_loop);
		}
	});	
}

function _get(page = 1) { 
	return new Promise(resolve => 
		http(getURL(page), { headers }, (err, response, body) => {
			if (err) {
				printError(`code: ${err.code} message: ${err.message}`);
				return resolve([]);
			}
			if (response && response.statusCode != 200) { 
				printError(`response: ${response.statusCode} ${response.statusMessage}`);
				return resolve([]);
			}
			
			let result = [];
			try {
				result = parse(body);
				console.log(`Get ${result.length} proxies (${APIName}, page: ${page})`);
			} catch (ex) { 
				printError(`message: ${ex.message}`);
			}
			return resolve(result);
		}));
	function printError(reason) { 
		console.error(`Error: ${reason} (${APIName}, page: ${page})`)
	}	
}

function parse(html = '') { 
	let result = [];
	
	let $ = cheerio.load(html);
	$('.ip').each((i, e) => {
		let prefix = $(e).parent().find('td').eq(2).text();
		if (prefix != 'http' && prefix != 'https') prefix = 'http';
		
		let ip = `${prefix}://`;
		$(e).children().each((i, e) => {
			let $e = $(e);
			if ($e.css('display') == 'none')
				return;
			ip += ($e.hasClass('port') ? ':' : '') + $e.text();
		});
		result.push(ip);
	});

	return result;
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms, ms)); }
