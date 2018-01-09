module.exports = {
	port: 4000,

	requestKeys: ["123456"],

	enableProxiesUpdate: false,
	proxiesUpdateURL: 'The URL return a proxies address list',

	autoCleanInvalidProxies: true,
	
	maxRetryTimes: 10,
	maxPreferredProxies: 15,
	
	timeout: 2000, // 2s,
};