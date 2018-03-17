var Discord = require('discord.io');
var logger = require('winston');
var request = require('request');
var auth = require('./auth.json');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
    });
logger.level = 'debug';
logger.info('Starting bot');


var bot = new Discord.Client({
	token: "NDI0Mzg1NDE2MjA5MzY3MDcy.DY4RZQ.53kjMr-voK87tKjC8qNbInKrUgs",
	autorun: true
});

logger.info('Bot variable created');

bot.on('ready', function(evt) {
	logger.info('Connected');
	logger.info('Logged in as: ');
	logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function(user, userID, channelID, message, evt) {
	if (message.substring(0, 1) == '!') {
		var args = message.substring(1).split(' ');
		var cmd = args[0];
		//Remove command from args array
		args = args.splice(1);
		switch(cmd) {
			case 'price':
				var itemName = args.join(' ').toLowerCase();
				var itemPrice = cachedPrices[itemName];
				if (itemPrice) {
					bot.sendMessage({
						to: channelID,
						message: '`Item: ' + itemName + ' Price: ' + itemPrice + '`'
					});
				} else {
					bot.sendMessage({
						to: channelID,
						message: '`Unable to find price for: ' + itemName + '`'
					});
				}
		}
	}
});

//Pricing stuff here
const PRICING_LINK = 'https://rsbuddy.com/exchange/summary.json';
const PRICE_UPDATE_DELAY = 30; //30 minutes between price updates
var cachedPrices = {};

function loadPrices() {
	logger.info('Retrieving prices');
	request.get(PRICING_LINK, (error, response, body) => {
		let pricingJson = JSON.parse(body);
		for (key in pricingJson) {
			if (pricingJson.hasOwnProperty(key)) {
				var itemPrice = pricingJson[key].overall_average;
				var itemName = pricingJson[key].name.toLowerCase();
				cachedPrices[itemName] = itemPrice;
			}
		}
	});
}

loadPrices();
setInterval(function() {
	logger.info('Updating prices');
	loadPrices();
}, PRICE_UPDATE_DELAY * 60 * 1000);
