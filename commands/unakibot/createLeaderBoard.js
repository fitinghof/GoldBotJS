const { SlashCommandBuilder } = require('discord.js');
const { saveGameData } = require('../../funcs');

module.exports = {
    category: 'unakibot',
	data: new SlashCommandBuilder()
		.setName('createLeaderBoard')
		.setDescription(`Creates a leaderboard in the channel you sent this.`),
	    async execute(interaction) {
            interaction.user.username
        },
};