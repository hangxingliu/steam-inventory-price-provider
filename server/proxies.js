//@ts-check

let fs = require('fs'),
	path = require('path'),
	config = require('../config.server'),
	{ maxPreferredProxies }  = config;

const DEFAULT_PROXIES_LIST = `${__dirname}/../config.proxy.list`;

let preferredProxies = [], spareProxies = [];
let proxyUpdater = null;

loadDefaultProxies();

module.exports = {
	bindProxyUpdater,
	getProxy, 
	getProxyCount,
	getNextProxyId,
	getRandomProxyId,
	cleanInvalidPreferredProxy,
	updateProxies
};
function bindProxyUpdater(_updater) { proxyUpdater = _updater; }

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

function cleanInvalidPreferredProxy(id) { 
	let proxy = preferredProxies[id];
	if (spareProxies.length == 0) {
		console.warn(`Warnning: could not clean invalid proxy: ${proxy}, because spare ip pool is empty!`);

		if (config.enableProxiesUpdate) { 
			process.nextTick(() => {
				console.log('Start updating proxies ...')
				proxyUpdater && proxyUpdater.get().then(newProxies => { 
					console.log(`Got ${newProxies.length} proxies.`);
					updateProxies(newProxies);
				});
			});
		}
		return;
	}
	preferredProxies[id] = spareProxies.shift();
}

function getProxy(id) {
	let proxy =  preferredProxies[id];
	if (!proxy) throw new Error(`preferredProxies[${id}] is not a valid proxy address!`);
	return proxy;
}
function getProxyCount() { return preferredProxies.length; }
function getNextProxyId(id) { return (id + 1) >= preferredProxies.length ? 0 : (id + 1); }
function getRandomProxyId() { return Math.floor(Math.random() * preferredProxies.length); }

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
