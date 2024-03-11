const { Events, Collection, PermissionsBitField } = require('discord.js');


module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;
		if(!interaction.appPermissions.has([
			PermissionsBitField.Flags.ViewChannel,
			PermissionsBitField.Flags.SendMessages
		])) return;


		if(!interaction.user.game){
			const {gameData}  = interaction.client
			let userData = gameData.get(interaction.user.id);
			if(!userData) 
			{
				userData = {name: (interaction.user.displayName), gold: 1000, banks: 0, prays:0 , totalLosses: 0, prayTotal: 0, totalWinnings: 0, failedPrayers: 0};
				gameData.set(interaction.user.id, userData);
			} else
			interaction.user.game = userData;
		}

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

        const { cooldowns } = interaction.client;

        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const defaultCooldownDuration = 3;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

            if (now < expirationTime) {
                const expiredTimestamp = Math.round(expirationTime / 1_000);
                return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, ephemeral: true });
            }
        }
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

		try {
			const startTime = Date.now()
			const startTimeFormated = new Date(startTime).toLocaleString();
			console.log(`[${startTimeFormated}] ${interaction.user.displayName} used "/${command.data.name}"`)
			await command.execute(interaction);
			const endTime = Date.now()
			endTimeFormated = new Date(endTime).toLocaleString()
			console.log(`[${endTimeFormated}] Command "/${command.data.name}" used by ${interaction.user.displayName} on [${startTimeFormated}] finished executing, took ${(endTime-startTime)/1000}s`)
		} catch (error) {
			console.error(error);
			try {
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
				} else {
					await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
				}
		} catch (error) {console.error(error)}
		}
	},
};