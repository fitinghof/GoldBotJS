const { SlashCommandBuilder, SlashCommandSubcommandBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');

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
            const targetUser = (interaction.options.getUser("target") ?? interaction.user);
            let userRoles = "";
            interaction.guild.roles.cache.each(role => 
                {if(role.name != "@everyone") role.members.each(user => {if(user.id === targetUser.id) userRoles += role.name + "\n"})});
            
            try {
            const auditlog = await interaction.guild.fetchAuditLogs();
            } catch(err){console.error(err); return interaction.reply(`Failed due to:\n${err}`)}
            console.log(auditlog);
            let audit = ""
            let nrOfEntries = 0;
            auditlog.entries.each(log => 
                {
                    if(log.executorId == targetUser.id) {
                        if(nrOfEntries < 10) audit += log.actionType + ", " + log.targetType + ` : ${log.reason ?? 'None'}\n`;
                        nrOfEntries++;
                    } 
            
                })
            audit += "+" + nrOfEntries + " more";
            const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(targetUser.displayName)
            .setDescription(`Global name: ${targetUser.globalName}\nNickname: ${targetUser.nickName ?? 'unloved'}\nID: ${targetUser.id}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: 'Roles', value: userRoles, inline: true },
            )
            .addFields({ name: 'Audit', value: audit, inline: true})
            .setTimestamp();
            await interaction.reply({embeds: [embed]});
        }
        else if (subcommand == "game"){
            const user = interaction.user;
            if(user.game){
                await interaction.reply(`#${user.username} \n**Gold:** ${user.game.gold} \n**Banks:** ${user.game.banks}`)
            } else await interaction.reply(`**${user.username}** \nYou need to join the game first!`)
        }
	},
};
