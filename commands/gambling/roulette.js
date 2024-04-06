const { SlashCommandBuilder, Collection, ActivityType} = require('discord.js');
const { saveGameData, updateLeaderBoards } = require('../../funcs');
const { rouletteWaitTime, standardBotActivity } = require('../../finaFilen.json')
module.exports = {
    category: 'gambling',
    save: true,
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
            .setRequired(true)),
	    async execute(interaction) {
            const color = await interaction.options.getString("color")
            const amount = ((await interaction.options.getInteger("amount")) ?? 1)
            const user = interaction.user;
            const { gameData } = interaction.client
            const playerGame = gameData.get(user.id)
            if(amount <= playerGame.gold) {
                const { rouletteRooms } = interaction.client
                const serverRoom = rouletteRooms.get(interaction.channel.id)
                if(serverRoom) {
                    if(serverRoom.has(interaction.user.id)) return await interaction.reply({content: `You are already in the roulette`, ephemeral: true})
                    playerGame.gold -= amount

                    serverRoom.set(interaction.user.id, {color: color, bet: amount})
                    console.log(`\`${interaction.user.displayName}\` joined the roulette with a bet of ${amount} on ${color}`)
                    return interaction.reply({content: `\`${interaction.user.displayName}\` joined the roulette with a bet of ${amount} 🪙  on ${color}`})
                }
                else {
                    playerGame.gold -= amount
                    spinTime = Math.round((Date.now() + rouletteWaitTime)/1000);
                    rouletteRooms.set(interaction.channel.id, new Collection().set(interaction.user.id, {color: color, bet: amount}));
                    const message = await interaction.reply(
                        {content: `\`${user.displayName}\` created a roulette room and put a bet of ${amount} 🪙  on ${color}.\n` + 
                        `Join them by using \`/roulette\` in the same channel!\nWheel will spin <t:${spinTime}:R>`});
                    console.log(`\`${user.displayName}\` created a roulette room and put a bet of ${amount} on ${color}.`)
                    interaction.client.user.setActivity('Playing roulette', {type: ActivityType.Custom});
                    return setTimeout(() => {
                        const number = Math.floor(Math.random() * 37);
                        const color = number == 0 ? 'green' : number % 2 ? 'red' : 'black';
                        const room = rouletteRooms.get(interaction.channel.id);
                        let playersStatus = '';
                        room.each((user, key) => {
                            const userGame = gameData.get(key);
                            if(user.color == color) {
                                const winnings = ((color == "green") ? user.bet * 36 : user.bet * 2);
                                userGame.addWinnings(winnings)
                                if(userGame.highestRouletteWin < winnings) userGame.highestRouletteWin = winnings;
                                playersStatus += `\n${gameData.get(key).name} won ${winnings} 🪙`;
                            }
                            else{
                                userGame.totalLosses += user.bet;
                                const jackPot = interaction.client.otherData.get("jackPot")
                                interaction.client.otherData.set("jackPot", jackPot + user.bet)
                                interaction.client.otherData.save()
                                playersStatus += `\n${gameData.get(key).name} lost ${user.bet} 🪙`;
                            }
                        })
                        message.edit(`The winning color is... ${color}! ` + playersStatus);
                        console.log(`rouletteRoom: ${user.displayName}, winning color: ${color}${playersStatus}` );
                        updateLeaderBoards(interaction.client)
                        interaction.client.rouletteRooms.sweep((obj, key) => key === interaction.channel.id);
                        if(!interaction.client.rouletteRooms.first()) {interaction.client.user.setActivity(standardBotActivity, {type: ActivityType.Custom});}
                    }, rouletteWaitTime)
                }
            }
            else return await interaction.reply(`You're too poor!`);
        },
};
