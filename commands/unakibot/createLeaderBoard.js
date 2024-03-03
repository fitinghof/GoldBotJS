const { SlashCommandBuilder } = require('discord.js');
const { saveLeaderBoards, updateLeaderBoards, makeLeaderString } = require('../../funcs');

module.exports = {
    category: 'unakibot',
	data: new SlashCommandBuilder()
		.setName('createleaderboard')
		.setDescription(`Creates a leaderboard in the channel you sent this.`),
	    async execute(interaction) {
            message = await interaction.channel.send("hello");
            interaction.client.leaderBoards.set(interaction.guild.id, message);
            message.pinned = true;
            await message.edit(makeLeaderString(interaction.client.gameData));
            saveLeaderBoards(interaction.client.leaderBoards);
            updateLeaderBoards(interaction.client.leaderBoards, interaction.client.gameData);
            return await interaction.reply({content: "Done!", ephemeral: true});
        },
};