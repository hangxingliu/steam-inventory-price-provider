//@ts-check

let fs = require('fs'),
	path = require('path'),
	config = require('../config.server'),
	{ maxPreferredProxies }  = config;

const DEFAULT_PROXIES_LIST = `${__dirname}/../config.proxy.list`;

let preferredProxies = [], spareProxies = [];
let proxySuccessTimes = [];

let proxyUpdater = null;

loadDefaultProxies();

module.exports = {
	bindProxyUpdater,
	getProxiesSummary,
	getProxy, 
	getProxyCount,
	getNextProxyId,
	getRandomProxyId,
	cleanInvalidPreferredProxy,
	markProxySuccess,
	updateProxies
};
function bindProxyUpdater(_updater) { proxyUpdater = _updater; }

function getProxiesSummary() { 
	return {
		preferredProxyCount: preferredProxies.length,
		spareProxyCount: spareProxies.length,
		preferredProxies: preferredProxies.map((ip, i) => ({
			ip, success: (proxySuccessTimes[i] || 0) 
		}))
	}
}

function updateProxies(update = []) { 
	// remove dumplicated
	update = update.filter(proxy =>
		preferredProxies.indexOf(proxy) < 0 &&
		spareProxies.indexOf(proxy) < 0);

	if (preferredProxies.length < maxPreferredProxies) { 
		let insertCount = maxPreferredProxies - preferredProxies.length;
		preferredProxies = preferredProxies.concat(update.slice(0, insertCount));
		update = update.slice(insertCount);
	}
	spareProxies = spareProxies.concat(update);
}

let updating = false;
function cleanInvalidPreferredProxy(id) { 
	let proxy = preferredProxies[id];
	proxySuccessTimes[id] = 0;
	
	if (spareProxies.length == 0) {
		console.warn(`Warnning: could not clean invalid proxy: ${proxy}, because spare ip pool is empty!`);

		if (!updating && config.enableProxiesUpdate) { 
			updating = true;
			process.nextTick(() => {
				console.log('Start updating proxies ...')
				proxyUpdater && proxyUpdater.get().then(newProxies => {
					console.log(`Got ${newProxies.length} proxies.`);
					updateProxies(newProxies);
					updating = false;
				});
			});
		}
		return;
	}
	preferredProxies[id] = spareProxies.shift();
}

function markProxySuccess(id) { 
	proxySuccessTimes[id] = (proxySuccessTimes[id] || 0) +1;
}

function getProxy(id) {
	let proxy =  preferredProxies[id];
	if (!proxy) throw new Error(`preferredProxies[${id}] is not a valid proxy address!`);
	return proxy;
}
function getProxyCount() { return preferredProxies.length; }
function getNextProxyId(id) { return (id + 1) >= preferredProxies.length ? 0 : (id + 1); }
function getRandomProxyId() {
	let id = Math.floor(Math.random() * preferredProxies.length);
	
	// Choose best proxy address (most success times)
	let rate = proxySuccessTimes[id] || 0,
		rateLeft = proxySuccessTimes[id - 1] || 0,
		rateRight = proxySuccessTimes[id + 1] || 0;
	let result = id;
	if (rateLeft > rate) { rate = rateLeft; result = id - 1; }
	if (rateRight > rate) { rate = rateRight; result = id + 1; }
	
	if (rate > 0)
		console.log(`RandomProxy: ${preferredProxies[result]} success: ${rate} times`);
	return result;
}

function loadDefaultProxies() { 
	if (!fs.existsSync(DEFAULT_PROXIES_LIST))
		return console.log(`You can create a ${path.basename(DEFAULT_PROXIES_LIST)} ` +
			`file like example file to giving some default proxies.`);

	preferredProxies = fs.readFileSync(DEFAULT_PROXIES_LIST, 'utf8')
		.split(/[\n\r]+/)
		.map(l => l.replace(/\s+/g, ''))
		.filter(l => l && !l.startsWith('#'));
	
	let half = Math.ceil(preferredProxies.length / 2);
	spareProxies = preferredProxies.slice(half);
	preferredProxies = preferredProxies.slice(0, half);
	
	console.log(`Loaded ${preferredProxies.length} preferred proxies` +
		` and ${spareProxies.length} spare proxies from default list file!`);
}
