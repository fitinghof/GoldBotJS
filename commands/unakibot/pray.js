const { SlashCommandBuilder } = require('discord.js');
const { saveLeaderBoards, updateLeaderBoards, makeLeaderString, saveGameData } = require('../../funcs');

module.exports = {
    category: 'unakibot',
    cooldown: 10,
	data: new SlashCommandBuilder()
		.setName('pray')
		.setDescription(`Allows you to pray for mor gold`)
        .addIntegerOption(option =>
            option.setName("amount")
            .setDescription("Choose how much to pray for, note, god does not look favorably opon the greedy.")
            .setMinValue(100)
            .setRequired(true))
        .addUserOption(option => 
            option.setName("targetuser")
            .setDescription("Who is the target of your favor")),
	    async execute(interaction) {
            const amount = ((await interaction.options.getInteger("amount")) ?? 100);
            const { gameData } = interaction.client;
            targetUser = interaction.options.getUser("targetuser") ?? interaction.user;
            targetUsergame = gameData.get(targetUser.id);
            if(!targetUsergame) return await interaction.reply({content: "User isn't in the game yet! tell them to use a bot command.", ephemeral: true});
            (targetUsergame.prays += 1) ?? (targetUsergame.prays = 1);
            if(!Math.floor(Math.random() * (amount/50)) ){
                (targetUsergame.prayTotal += amount) ?? (targetUsergame.prayTotal = amount);
                targetUsergame.gold += amount;
                saveGameData(gameData);
                updateLeaderBoards(interaction.client);
                return await interaction.reply(`God has gifted upon \`${targetUser.displayName}\` ${amount} gold!`)
            } else  ((targetUsergame.failedPrayers += 1) ?? (targetUsergame.failedPrayers = 1));
            return await interaction.reply({content: `You were not worthy.`, ephemeral: true})

        },
};