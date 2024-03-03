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
            interaction.guild.roles.cache.each(role => 
                {if(role.name != "@everyone") role.members.each(user => {if(user.id === guildMemberObj.id) userRoles += role.name + "\n"})});
            
            let audit = "";
            if(interaction.appPermissions.has(PermissionsBitField.Flags.ViewAuditLog)){
            const auditlog = await interaction.guild.fetchAuditLogs();
            let nrOfEntries = 0;
            auditlog.entries.each(log => 
                {
                    if(log.executorId == guildMemberObj.id) {
                        if(nrOfEntries < 10) audit += log.actionType + ", " + log.targetType + ` : ${log.reason ?? 'None'}\n`;
                        nrOfEntries++;
                    } 
            
                })
            if(nrOfEntries > 10) {
            audit += "+ " + nrOfEntries-10 + " more";
            } else if(nrOfEntries == 0) audit = "None";
            } else audit = "Bot lacks sufficient permissions to view auditlog.";
            const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(guildMemberObj.displayName)
            .setDescription(`Globalname: ${userObj.globalName ?? "None"}\nNickname: ${guildMemberObj.nickname ?? 'None'}\nID: ${guildMemberObj.id}${guildMemberObj.bot ? "\nBot" : ""}`)
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
