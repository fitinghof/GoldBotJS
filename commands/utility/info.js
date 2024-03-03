const { SlashCommandBuilder, SlashCommandSubcommandBuilder, ActionRowBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

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
            const userObj = (interaction.options.getUser("target") ?? interaction.user);
            const guildMemberObj = interaction.guild.members.cache.get(userObj.id);
            let userRoles = "";
            interaction.guild.roles.cache.each(role => {if(role.name != "@everyone") role.members.each(user => {if(user.id === guildMemberObj.id) userRoles += role.name + "\n"})});
            
            let audit = "";
            if(interaction.appPermissions.has(PermissionsBitField.Flags.ViewAuditLog)){
            const auditlog = await interaction.guild.fetchAuditLogs();
            auditSize = 0;
            const userAuditLogs = auditlog.entries.filter(log => log.executorId == guildMemberObj.id) 
            userAuditLogs.each(log => {
                if(auditSize < 10){
                audit += (log.actionType + ", " + log.targetType + ` ${log.reason ? `Why: ${log.reason}\n` : ""}\n`)
                } auditSize++;
            });            
            audit += (auditSize >= 10) ? `+ ${auditSize - 10} more` : " ";
            } else audit = "Bot lacks sufficient permissions to view auditlog.";

            const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(guildMemberObj.displayName)
            .setDescription(`Globalname: ${guildMemberObj.user.globalName ?? "None"}\nNickname: ${guildMemberObj.nickname ?? 'None'}\nID: ${guildMemberObj.id}${guildMemberObj.user.bot ? "\nBot" : ""}`)
            .setThumbnail(guildMemberObj.displayAvatarURL())
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
                await interaction.reply(`## ${user.displayName} \n**Gold:** ${user.game.gold}🪙 \n**Banks:** ${user.game.banks}🏦`)
            } else await interaction.reply(`**${user.username}** \nYou need to join the game first!`)
        }
	},
};
