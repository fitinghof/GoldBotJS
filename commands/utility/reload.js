const { SlashCommandBuilder } = require('discord.js');
const path = require('node:path');

module.exports = {
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('Only SibbeeeGold has the power')
				.setRequired(true)),
	async execute(interaction) {
		const commandName = interaction.options.getString('command', true).toLowerCase();
		const command = interaction.client.commands.get(commandName);

		if(interaction.user.id != "431021822448762880") {
			return interaction.reply({content: "Only SibbeeeGold has the power.", ephermal: true})
		}
		if (!command) {
			return interaction.reply({content: `There is no command with name \`${commandName}\`!`, ephemeral: true});
		}
		filepath = path.dirname(__dirname)
		filepath = path.join(filepath, command.category, command.data.name);
		delete require.cache[require.resolve(`${filepath}.js`)];

		try {
			interaction.client.commands.delete(command.data.name);
			const newCommand = require(`${filepath}.js`);
			interaction.client.commands.set(newCommand.data.name, newCommand);
			await interaction.reply({content: `Command \`${newCommand.data.name}\` was reloaded!`, ephemeral: true});
		} catch (error) {
			console.error(error);
			await interaction.reply({content: `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``, ephemeral: true});
		}
	},
};