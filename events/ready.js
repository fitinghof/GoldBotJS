const { Events, ActivityType } = require('discord.js');
const { standardBotActivity } = require("../../finaFilen.json")

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		client.user.setActivity(standardBotActivity, {type: ActivityType.Custom});
	},
};