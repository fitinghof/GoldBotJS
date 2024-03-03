const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'utility',
    cooldown: 5,
	data: new SlashCommandBuilder()
    .setName('pfp')
    .setDescription('Gives you the profilepick of the target user')
    .addUserOption(option =>
        option.setName("targetuser")
        .setDescription("User who's profile picture you want to steal")),
	async execute(interaction) {
        const targetUser = interaction.options.getUser("targetuser") ?? interaction.user;
		await interaction.reply(targetUser.displayAvatarURL());
	},
};