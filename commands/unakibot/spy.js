const { SlashCommandBuilder } = require('discord.js');
const { bankCost, bankearnings, bankPeriodmin } = require('../../finaFilen.json');

module.exports = {
    category: 'unakibot',
	data: new SlashCommandBuilder()
		.setName('spy')
		.setDescription(`Allows you to peer into the pockets of strangers`)
        .addUserOption(option =>
            option.setName("target")
            .setDescription("Who is the target of your perversion?")
            .setRequired(true)),
	    async execute(interaction) {
            const targetUser = interaction.options.getUser("target");
            if(targetUser){
                const { gameData } = interaction.client;
                const userGame = gameData.get(targetUser.id);
                if(userGame){
                    console.log(`${interaction.user.displayName} spied on ${targetUser.displayName}`);
                    await interaction.reply({content: userGame.toString(), ephemeral: true})
                } else await interaction.reply({content: `${targetUser.displayName} seems lost in a great emptiness, devoid of anything material`, ephemeral: true})
            }
        }
};
