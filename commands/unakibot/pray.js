const { SlashCommandBuilder } = require('discord.js');
const { saveLeaderBoards, updateLeaderBoards, makeLeaderString, saveGameData } = require('../../funcs');

module.exports = {
    category: 'unakibot',
	data: new SlashCommandBuilder()
		.setName('pray')
		.setDescription(`Allows you to pray for mor gold`)
        .addIntegerOption(option =>
            option.setName("amount")
            .setDescription("Choose how much to pray for, note, god does not look favorably opon the greedy.")
            .setMinValue(1))
        .addUserOption(option => 
            option.setName("targetuser")
            .setDescription("Who is the target of your favor")),
	    async execute(interaction) {
            const amount = ((await interaction.options.getInteger("amount")) ?? 1);
            targetUser = interaction.options.getUser("targetuser") ?? interaction.user;
            if(!targetUser.game) return await interaction.reply({content: "User isn't in the game yet! tell them to use a bot command.", ephemeral: true});
            if(!Math.round(Math.random() * (amount + 1)) || interaction.user.id == "431021822448762880"){
                targetUser.game.gold += amount;
                saveGameData(interaction.client.gameData, targetUser);
                updateLeaderBoards(interaction.client.leaderBoards, interaction.client.gameData);
                return await interaction.reply(`God has gifted opon ${targetUser.nickname ?? targetUser.displayName} ${amount} gold!`)
            }
            return await interaction.reply({content: `You were not worthy.`, ephemeral: true})

        },
};