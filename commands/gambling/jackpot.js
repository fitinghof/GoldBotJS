const { SlashCommandBuilder, Collection, ActivityType} = require('discord.js');
const { saveGameData, updateLeaderBoards, randomFailMessage } = require('../../funcs');
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
                return interaction.reply({content:`The current JackPot is: **${jackPot}  🪙**`})
            }
            if(!Math.floor(Math.random()*200)) {
                return interaction.reply({content:`**${interaction.user.displayName} WON THE JACKPOT\nGot ${jackPot}  🪙!**`})
            }
            return interaction.reply({content: randomFailMessage(), ephemeral: true})
        }
}