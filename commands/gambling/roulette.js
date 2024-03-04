const { SlashCommandBuilder } = require('discord.js');
const { saveGameData, updateLeaderBoards } = require('../../funcs');

module.exports = {
    category: 'gambling',
	data: new SlashCommandBuilder()
		.setName('roulette')
		.setDescription(`Gamble gold`)
        .addStringOption(option =>
            option.setName("color")
            .setDescription("What color to place your bet on")
            .setRequired(true)
            .addChoices(["green", "red", "black"]))
            .addIntegerOption(option => 
                option.setName("amount")
                .setDescription("How much to bet")
                .setMinValue(1)
                .setRequired(true)),
	    async execute(interaction) {
            const color = await interaction.options.getString("color");
            const amount = ((await interaction.options.getInteger("amount")) ?? 1);
            user = interaction.user;
            if(!user.game) {
                return await interaction.reply({content: "You need to join the game first!", ephemeral: true})
            } 
            if(amount <= user.game.gold) {
                const number = Math.floor(Math.random() * 37);
                const color = number == 0 ? 'green' : number % 2 ? 'red' : 'black';
                
            }
            return await interaction.reply(`You couln't afford that many banks!`);
        },
};