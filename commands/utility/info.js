const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('discord.js');

module.exports = {
    category: 'utility',
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('shows info')
        .addSubcommand(subcommand =>
            subcommand
            .setName("server")
            .setDescription("Shows server info"))
        .addSubcommand(subcommand =>
            subcommand
            .setName("user")
            .setDescription("Shows info on a user")
            .addUserOption(option => option.setName("target").setDescription("Shows info on target user")))
        .addSubcommand(subcommand =>
            subcommand
            .setName("game")
            .setDescription("Shows your current stats in the discord game")),
	async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand == "server") {
            await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
        }
        else if (subcommand == "user"){
            const targetUser = interaction.options.getUser("target");
            if(targetUser){
                await interaction.reply(`This command was run by ${target.username}, who joined on ${target.joinedAt}.`);
            } else await interaction.reply(`This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`);
        }
        else if (subcommand == "game"){
            const user = interaction.user;
            if(user.game){
                await interaction.reply(`**${user.username}** \n**Gold:** ${user.game.gold} \n**Banks:** ${user.game.banks}`)
            } else await interaction.reply(`**${user.username}** \nYou need to join the game first!`)
        }
	},
};