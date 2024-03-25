const { SlashCommandBuilder, Collection, ActivityType} = require('discord.js');
const { saveGameData, updateLeaderBoards } = require('../../funcs');
const { rouletteWaitTime, standardBotActivity } = require('../../finaFilen.json')
module.exports = {
    category: 'gambling',
    save: true,
    cooldown: 7200,
	data: new SlashCommandBuilder()
		.setName('rob')
		.setDescription(`Allows you to rob another player but make sure they're not home!`)
        .addUserOption(option =>
            option.setName("target")
            .setDescription("Who is it you will attempt to rob?")
            .setRequired(true))
        .addIntegerOption(option =>
            option.setName("amount")
            .setDescription("How much will you try to take? You will need equipment worth 1/5 of this.")
            .setMinValue(100)),
	    async execute(interaction) {
            const robAmount = interaction.options.getInteger("amount") ?? 100;
            const playerGame = interaction.client.gameData.get(interaction.user.id);
            if(playerGame.gold < (robAmount / 5)) {
                interaction.client.cooldowns.get(interaction.commandName).delete(interaction.user.id);
                return await interaction.reply({content: `You couldn't afford the equipment neccessary for a heist of this scale and promptly gave up.`, ephemeral: true})
            }
            const { gameData } = interaction.client;
            const targetUser = await interaction.guild.members.fetch(await interaction.options.getUser("target").id);
            const targetUserGame = gameData.get(targetUser.id);
            if (!targetUserGame) {
                interaction.client.cooldowns.get(interaction.commandName).delete(interaction.user.id);
                return await interaction.reply({content: `You find ${targetUser.displayName} begging for cash outside of ICA. You kick him and leave. He should have bought some banks!`, ephemeral: true})
            } 
            if (targetUserGame.gold < robAmount) {
                interaction.client.cooldowns.get(interaction.commandName).delete(interaction.user.id);
                return await interaction.reply({content: `After scouting the propery you realise this guy wasn't worth as much as you thought and leave in dissapointment.`, ephemeral: true})
            }
            const activity = (targetUser.presence) ? targetUser.presence.status : "idle";
            const activityChanceModifier = (activity === "online") ? 100 : (activity === "idle" || activity === "dnd") ? 1 : 0.5;
            //const chance = 0.8 / (1 + (40/Math.pow(targetUserGame.gold / robAmount, 3)) * activityChanceModifier);
            const chance = 0.8/(1+30*Math.pow(robAmount / targetUserGame.gold, 3) * activityChanceModifier) 
            console.log(`robbery success chance: ${chance}, target gold: ${targetUserGame.gold} robAmount: ${robAmount}`);
            playerGame.gold -= Math.round(robAmount/5);
            if(!Math.floor(Math.random() * 1/chance)){
                targetUserGame.gold -= robAmount;
                targetUserGame.addLog(`${interaction.user.displayName} robbed you for ${robAmount} 🪙!`)
                playerGame.gold += Math.round(robAmount*6/5);
                return await interaction.reply({content: `${interaction.user.displayName} robbed ${targetUser.displayName} for ${robAmount} 🪙!`, ephemeral: false})
            }
            return await interaction.reply({content: `After tripping on a sausage and slapping the dog with a lamp you get caught by the police and lose your pricey equipment!`, ephemeral: true})
        }
}