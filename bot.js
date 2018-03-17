var Discord = require('discord.io');
var logger = require('winston');
var request = require('request');
var auth = require('./auth.json');
var helpers = require('./helpers');
var highscores = require('./highscores');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
    });
logger.level = 'debug';
logger.info('Starting bot');


var bot = new Discord.Client({
	token: auth.token,
	autorun: true
});

logger.info('Bot variable created');

bot.on('ready', function(evt) {
	logger.info('Connected');
	logger.info('Logged in as: ');
	logger.info(bot.username + ' - (' + bot.id + ')');
	bot.setPresence({
		game: {
			name: "Type !help for commands.",
		}
	});
});

bot.on('message', function(user, userID, channelID, message, evt) {
	if (message.substring(0, 1) == '!') {
		var args = message.substring(1).split(' ');
		var cmd = args[0];
		//Remove command from args array
		args = args.splice(1);
		switch(cmd) {
			case 'price':
				var itemNames = args.join(' ').toLowerCase().split(',');
				itemNames.forEach(function(itemName) {
					itemName = itemName.trim();
					logger.info('Attempting to get price for ' + itemName + ' in channel ' + channelID);
					itemPrice = cachedPrices[itemName];
					if (itemPrice) {
						bot.sendMessage({
							to: channelID,
							message: '`Item: ' + itemName + ' Price: ' + formatNumber(itemPrice) + '`'
						});
					} else {
						bot.sendMessage({
							to: channelID,
							message: '`Unable to find price for: ' + itemName + '`'
						});
					}
				});
				break;
			case 'stats':
				var gameMode = '-n'
				if ('-n|-i|-u'.indexOf(args[args.length - 1]) != -1) {
					//Found a gamemode modifier
					gameMode = args[args.length - 1];
					args.pop();
				}
				var playerName = args.join(' ').toLowerCase().trim();
				var playerStatsMessage = "1";
				highscores.getHighscoresForPlayer(playerName, gameMode, function(playerStatsMessage) {
					if (playerStatsMessage) {
						bot.sendMessage({
							to: channelID,
							message: playerStatsMessage
						});
					} else {
						bot.sendMessage({
							to: channelID,
							message: '`Unable to find stats for player: ' + playerName + '`'
						});
					}
				});
				break;
			case 'help':
				bot.sendMessage({
					to: userID,
					message: helpers.getHelpMessage()
				});
				break;
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

//loadPrices();
setInterval(function() {
	logger.info('Updating prices');
	loadPrices();
}, PRICE_UPDATE_DELAY * 60 * 1000);

//Helper methods
function formatNumber(number) {
	return number.toLocaleString();
}
