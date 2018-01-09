//@ts-check

let express = require('express'),
	proxies = require('./proxies'),
	{ request } = require('./request'),
	config = require('../config.server'),
	{ requestKeys } = config,
	web = express();

let proxiesUpdate = ([
	require('./proxies-update/api1'),
	require('./proxies-update/api2'),
])[1];

web.use((req, res) => {
	if (req.url == '/')
		return response(200, { success: 'connected!' });

	if (req.method != 'GET')
		return response(405, { error: `${req.method} is not allowed!` });
	
	if (requestKeys.length) {
		let key = req.query.key;
		if (!key || requestKeys.indexOf(key) < 0)	
			return response(403, { error: `wrong key!` });
	}
	
	if (!checkParameters('country', 'currency', 'appid', 'market_hash_name'))	
		return;

	let { country, currency, appid, market_hash_name } = req.query;
	request({ country, currency, appid, market_hash_name })
		.then(({ status, body }) => {
			let obj = null;
			try {
				obj = JSON.parse(body);
			} catch (ex) {
				return Promise.reject(new Error(`Invalid response JSON: ${body}`));
			}

			console.log(`Response(${status}):` +
				` ${market_hash_name} => lowest_price: ${obj.lowest_price}`);
			response(status, obj);
			return Promise.resolve(true);
		}).catch(ex => response(500, { error: ex.message || '' }));

	
	function checkParameters(...parameterNames) { 
		for (let parameterName of parameterNames) {
			if (!(parameterName in req.query)) {
				response(422, { error: `parameter ${parameterName} is missing!` });
				return false;
			}
		}	
		return true;
	}
	function response(code, obj) { 
		res.status(code);
		res.json(obj);
	}
});

// web.use((req, res) => {
// 	res.status(404);
// 	res.json({ error: `Request(${req.method} ${req.url}) is invalid!` });
// });
web.use((err, req, res, next) => {
	res.status(500);
	res.json({ error: `Server inner exception` });
	if (err instanceof Error)
		//@ts-ignore	
		console.error(`Error: {code: "${err.code}", message: "${err.message}"}\n ${err.stack}`);
	else
		console.error(`Error: ${err}`);	
}); 

// ===================
//       M a i n 
// ===================
new Promise((resolve) => {
	if (config.enableProxiesUpdate) { 
		return proxiesUpdate.get().then(newProxies => { 
			console.log(`Got ${newProxies.length} proxies.`);
			proxies.updateProxies(newProxies);
		}).then(resolve);
	}
	return resolve(true);
}).then(() => {
	web.listen(config.port, () => {
		console.log(`Steam inventory price provider server listened on port ${config.port}`);
	});
});

