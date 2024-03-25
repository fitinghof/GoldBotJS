const { SlashCommandBuilder } = require('discord.js');
const { updateLeaderBoards, saveGameData, randomFailMessage } = require('../../funcs');
module.exports = {
    category: 'unakibot',
    cooldown: 10,
	data: new SlashCommandBuilder()
		.setName('pray')
		.setDescription(`Allows you to pray for more gold`)
        .addIntegerOption(option =>
            option.setName("amount")
            .setDescription("Choose how much to pray for, note, god does not look favorably opon the greedy.")
            .setMinValue(100))
        .addUserOption(option => 
            option.setName("targetuser")
            .setDescription("Who is the target of your favor")),
	    async execute(interaction) {
            const amount = ((await interaction.options.getInteger("amount")) ?? 100);
            const { gameData } = interaction.client;
            targetUser = interaction.options.getUser("targetuser") ?? interaction.user;
            targetUsergame = gameData.get(targetUser.id);
            if(!targetUsergame) return await interaction.reply({content: "User isn't in the game yet! tell them to use a bot command.", ephemeral: true});
            if(!Math.floor(Math.random() * (amount/50)) ){
                targetUsergame.addPray(amount, true);
                saveGameData(gameData);
                updateLeaderBoards(interaction.client);
                console.log(`"${interaction.user.displayName}" prayed for ${amount} to "${targetUser.displayName}" success`)
                return await interaction.reply(`God has gifted upon \`${targetUser.displayName}\` ${amount} 🪙 !`)
            }  
            console.log(`"${interaction.user.displayName}" prayed for ${amount} to "${targetUser.displayName}" failed`)
            targetUsergame.addPray(amount, false);
            return await interaction.reply({content: randomFailMessage(), ephemeral: true})

        },
};