const { SlashCommandBuilder, Collection, ActivityType} = require('discord.js');
const { saveGameData, updateLeaderBoards, randomFailMessage, player } = require('../../funcs');
module.exports = {
    category: 'gambling',
    cooldown: 72000,
	data: new SlashCommandBuilder()
		.setName('jackpot')
		.setDescription(`Take a shot at winning back your losses!`)
        .addBooleanOption(option =>
            option.setName("spin")
            .setDescription("Allows you to choose to check the current jackpot or spin for the win, false = check = default")),
	    async execute(interaction) {
            const spin = interaction.options.getBoolean("spin") ?? false
            const jackPot = interaction.client.otherData.get("jackPot")
            if(!spin) {
                interaction.client.cooldowns.get(interaction.commandName).delete(interaction.user.id);
                return interaction.reply({content:`The current JackPot is: **${jackPot}  🪙**\nUse \`/jackPot spin:True\` to spin!`})
            }
            if(!Math.floor(Math.random()*200)) {
                const playerGame = interaction.client.gameData.get(interaction.user.id)
                playerGame.gold += jackPot
                const win = jackPot
                jackPot = 0
                interaction.client.otherData.save()
                return interaction.reply({content:`**${interaction.user.displayName} WON THE JACKPOT\nGot ${win}  🪙!**`})
            }
            return interaction.reply({content: randomFailMessage(), ephemeral: true})
        }
}