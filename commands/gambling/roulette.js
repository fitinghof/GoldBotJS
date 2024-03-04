const { SlashCommandBuilder, Collection} = require('discord.js');
const { saveGameData, updateLeaderBoards } = require('../../funcs');

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
                    return interaction.reply({content: `It doesn't seem like ${targetUser.displayName} has an active roulette room`})
                }
                gameData.get(user.id).gold -= amount;
                const roomId = (targetUser ? targetUser.id : user.id);
                if(targetUser) {
                    interaction.client.rouletteRooms.get(roomId).set(interaction.user.id, {color: color, bet: amount});
                    interaction.reply({content: `${targetUser.displayName} joined ${targetUser.displayName} with a bet of ${amount} on ${color}`});
                }
                else {
                interaction.client.rouletteRooms.set(roomId, new Collection().set(interaction.user.id, {color: color, bet: amount}));
                interaction.reply({content: `${user.displayName} created a roulette room and put a bet of ${amount} on ${color}`});
                const channel = interaction.channel;
                }
            }
            return await interaction.reply(`You couln't afford that many banks!`);
        },
};
//spon roulette sorta:
/* setTimeout(() => {
    const number = Math.floor(Math.random() * 37);
    const color = number == 0 ? 'green' : number % 2 ? 'red' : 'black';
    const room = rouletteRooms.get(roomId);
    let winners = "";
    room.each((user, key) => {
        if(user.color == color) {
            gameData.get(key) += color == "green" ? user.bet * 35 : user.bet * 2;
            winners += "\n" + gameData.get(key).name;
        }
        channel.send(winners ? `The winners are: ${winners}` : `No one won this time!`)
    })
    interaction.client.rouletteRooms.delete(roomId);
}, 15_000) */