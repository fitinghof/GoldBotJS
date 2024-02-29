const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'unakibot',
	data: new SlashCommandBuilder()
		.setName('joingame')
		.setDescription('Allows you to play in the discord game'),
	async execute(interaction) {
        if(!interaction.user.game){
            interaction.user.game = {
                gold : 1000,
                banks : 0,
            }
            await interaction.reply(`${interaction.user.username} joined the game!`);
            return
        } 
        await interaction.reply(`You are already in the game`);
	},
};