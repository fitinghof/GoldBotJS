const { SlashCommandBuilder } = require('discord.js');
const { saveGameData, updateLeaderBoards } = require('../../funcs');

module.exports = {
    category: 'unakibot',
	data: new SlashCommandBuilder()
		.setName('buybank')
		.setDescription(`Gives you ${250} gold per day, costs ${1000}`)
        .addIntegerOption(option =>
            option.setName("amount").setDescription("How many banks do you want to buy?").setMinValue(1)),
	    async execute(interaction) {
            const amount = ((await interaction.options.getInteger("amount")) ?? 1);
            user = interaction.user;

            if(!user.game) {
                return await interaction.reply({content: "You need to join the game first!", ephemeral: true})
            } 
            if((amount) * 1000 <= user.game.gold) {
                const { gameData } = interaction.client;
                user.game.gold -= amount * 1000;
                user.game.banks += amount;
                saveGameData(interaction.client.gameData, user);
                updateLeaderBoards(interaction.client);
                return await interaction.reply(`${interaction.user.username} bought ${amount} banks`);
            }
            return await interaction.reply(`You couln't afford that many banks!`);
        },
};