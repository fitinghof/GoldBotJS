const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { saveLeaderBoards, updateLeaderBoards, makeLeaderString } = require('../../funcs');

module.exports = {
    category: 'unakibot',
	data: new SlashCommandBuilder()
		.setName('createleaderboard')
		.setDescription(`Creates a leaderboard in the channel you sent this.`)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
	    async execute(interaction) {
            if(!interaction.appPermissions.has(PermissionsBitField.Flags.ViewChannel)) return interaction.reply({content: "Bot is missing necessary permissions.", ephemeral: true})
            message = await interaction.channel.send(makeLeaderString(interaction.client.gameData));
            message.pinned = true;
            interaction.client.leaderBoards.set(interaction.guild.id, {channel: interaction.channel.id, id: message.id});
            saveLeaderBoards(interaction.client.leaderBoards);
            return await interaction.reply({content: "Done!", ephemeral: true});
        },
};