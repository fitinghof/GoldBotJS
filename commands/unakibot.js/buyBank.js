const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'unakibot',
	data: new SlashCommandBuilder()
		.setName('buybank')
		.setDescription(`Gives you ${250} gold per day, costs ${1000}`)
        .addIntegerOption(option =>
            option.setName("amount").setDescription("How many banks do you want to buy?").setMinValue(1)),
	    async execute(interaction) {
            const amount = interaction.options.getInteger("amount");
            user = interaction.user;
            if(!user.game) {
                return await interaction.reply({content: "You need to join the game first!", ephereal: true})
            } 
            if((amount ?? 1) * 1000 <= user.game.gold) {
                user.game.gold -= amount * 1000;
                user.game.banks += amount;
                return await interaction.reply(`${interaction.user.username} bought ${amount} banks`);
            }
            return await interaction.reply(`You couln't afford that many banks!`);
        },
};