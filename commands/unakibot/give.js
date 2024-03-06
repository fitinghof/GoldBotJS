const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { saveLeaderBoards, updateLeaderBoards, makeLeaderString } = require('../../funcs');

module.exports = {
    category: 'unakibot',
	data: new SlashCommandBuilder()
		.setName('give')
		.setDescription(`Gives gold to the target user`)
        .addIntegerOption(option =>
            option.setName("amount")
            .setDescription("Allows you to give another user gold")
            .setRequired(true))
        .addIntegerOption(option =>
            option.setName("target")
            .setDescription("The user that you will send gold to")
            .setMinValue(1)
            .setRequired(true)),
	    async execute(interaction) {
            const amount = interaction.options.getInteger("amount") ?? 100;
            const targetUser = interaction.option.getUser("target");
            const targetUserGame = interaction.client.gameData.get(targetUser.id);
            const senderUserGame = interaction.client.gameData.get(interaction.user.id);
            if(senderUserGame.gold >= amount){
                if(targetUserGame){
                    senderUserGame.gold -= amount;
                    targetUserGame.gold += amount;
                    return await interaction.reply({content: `Sent ${targetUser.displayName} ${amount} gold!`, ephemeral: true})
                }
                return await interaction.reply({content: `${targetUser.displayName} isn't in the game yet!`, ephemeral: true})
            }
            return await interaction.reply({content: `You're too poor.`, ephemeral: true})
        },
};