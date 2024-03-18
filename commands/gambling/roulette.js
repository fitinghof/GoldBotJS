const { SlashCommandBuilder, Collection, ActivityType} = require('discord.js');
const { saveGameData, updateLeaderBoards } = require('../../funcs');
const { rouletteWaitTime, standardBotActivity } = require('../../finaFilen.json')
module.exports = {
    category: 'gambling',
	data: new SlashCommandBuilder()
		.setName('roulette')
		.setDescription(`Gamble gold`)
        .addStringOption(option =>
            option.setName("color")
            .setDescription("What color to place your bet on")
            .setRequired(true)
            .addChoices({name: "green", value: "green"}, {name: "red", value: "red"}, {name: "black", value: "black"}))
        .addIntegerOption(option => 
            option.setName("amount")
            .setDescription("How much to bet")
            .setMinValue(1)
            .setRequired(true))
        .addUserOption(option => 
            option.setName("joinplayer")
            .setDescription("Allows you to join another players roulette room if they have one")),
	    async execute(interaction) {
            const targetUser = interaction.options.getUser("joinplayer");
            const color = await interaction.options.getString("color");
            const amount = ((await interaction.options.getInteger("amount")) ?? 1);
            const user = interaction.user;
            const { gameData } = interaction.client;
            if(amount <= gameData.get(user.id).gold) {
                const { rouletteRooms } = interaction.client;
                if(targetUser && !interaction.client.rouletteRooms.has(targetUser.id)) {
                    return interaction.reply({content: `It doesn't seem like \`${targetUser.displayName}\` has an active roulette room`, ephemeral: true})
                }
                if(interaction.client.rouletteRooms.has(interaction.user.id)){
                    return interaction.reply({content: `You are already in a roulette room`, ephemeral: true})
                }
                gameData.get(user.id).gold -= amount;
                const roomId = (targetUser ? targetUser.id : user.id);

                if(targetUser) {
                    interaction.client.rouletteRooms.get(roomId).set(interaction.user.id, {color: color, bet: amount});
                    console.log(`\`${interaction.user.displayName}\` joined \`${targetUser.displayName}\` with a bet of ${amount} on ${color}`)
                    return interaction.reply({content: `\`${interaction.user.displayName}\` joined \`${targetUser.displayName}\` with a bet of ${amount} on ${color}`});
                }
                else {
                    spinTime = Math.round((Date.now() + rouletteWaitTime)/1000);
                    interaction.client.rouletteRooms.set(roomId, new Collection().set(interaction.user.id, {color: color, bet: amount}));
                    const message = await interaction.reply(
                        {content: `\`${user.displayName}\` created a roulette room and put a bet of ${amount} 🪙  on ${color}.\n` + 
                        `Join them with /roulette joinplayer: \`${user.displayName}\`!\nWheel will spin <t:${spinTime}:R>`});
                    console.log(`\`${user.displayName}\` created a roulette room and put a bet of ${amount} on ${color}.`)
                    interaction.client.user.setActivity('Playing roulette', {type: ActivityType.Custom});
                    return await new Promise(() => setTimeout(() => {
                        const number = Math.floor(Math.random() * 37);
                        const color = number == 0 ? 'green' : number % 2 ? 'red' : 'black';
                        const room = rouletteRooms.get(roomId);
                        let playersStatus = '';
                        room.each((user, key) => {
                            const userGame = gameData.get(key);
                            if(user.color == color) {
                                const winnings = ((color == "green") ? user.bet * 36 : user.bet * 2);
                                userGame.addWinnings(winnings)
                                playersStatus += `\n${gameData.get(key).name} won ${winnings} 🪙`;
                            }
                            else{
                                userGame.totalLosses += user.bet;
                                playersStatus += `\n${gameData.get(key).name} lost ${user.bet} 🪙`
                            }
                        })
                        message.edit(`The winning color is... ${color}! ` + playersStatus);
                        console.log(`rouletteRoom: ${user.displayName}, winning color: ${color}${playersStatus}` );
                        interaction.client.rouletteRooms.sweep((obj, key) => key === roomId);
                        if(!interaction.client.rouletteRooms.first()) {interaction.client.user.setActivity(standardBotActivity, {type: ActivityType.Custom});}
                        updateLeaderBoards(interaction.client);
                        saveGameData(gameData);
                    }, rouletteWaitTime)).catch(err => console.error(err))
                }
            }
            else return await interaction.reply(`You're too poor!`);
        },
};
