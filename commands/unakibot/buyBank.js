const { SlashCommandBuilder } = require('discord.js');
const { saveGameData, updateLeaderBoards } = require('../../funcs');
const { bankCost, bankearnings, bankPeriodmin } = require('../../finaFilen.json');

module.exports = {
    category: 'unakibot',
	data: new SlashCommandBuilder()
		.setName('buybank')
		.setDescription(`Gives you ${bankearnings} gold every ${bankPeriodmin}:th minute, costs ${bankCost}`)
        .addIntegerOption(option =>
            option.setName("amount").setDescription("How many banks do you want to buy?").setMinValue(1)),
	    async execute(interaction) {
            const amount = ((await interaction.options.getInteger("amount")) ?? 1);
            const { gameData } = interaction.client;
            user = interaction.user;
            const userGame = gameData.get(user.id);
            if((amount) * bankCost <= userGame.gold) {
                userGame.gold -= amount * bankCost;
                userGame.banks += amount;
                console.log(`${userGame.name} bought ${amount} banks`)
                saveGameData(gameData);
                updateLeaderBoards(interaction.client);
                return await interaction.reply(`${user.displayName} bought ${amount} ${(amount == 1) ? `bank` : `banks`}`);
            }
            return await interaction.reply({content: `You couln't afford that many banks!`, ephemeral: true});
        },
};