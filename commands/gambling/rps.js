const { SlashCommandBuilder } = require('discord.js');
const { saveGameData, updateLeaderBoards } = require('../../funcs');
const { bankCost, bankearnings, bankPeriodmin } = require('../../finaFilen.json');

module.exports = {
    category: 'gambling',
	data: new SlashCommandBuilder()
		.setName('rps')
		.setDescription(`Play rock paper scissors against another player!`)
        .addUserOption(option=> 
            option.setName("target")
            .setDescription("The user to challenge")
            .setRequired(true))
            .addIntegerOption(option => 
                option.setName("bet")
                .setDescription("How much will you bet on you winning?")
                .setMinValue(1)
                .setRequired(true))
                .addIntegerOption(option =>
                    option.setName("weapon")
                    .setDescription("Choose rock, paper or scissors")
                    .setChoices({name:"rock", value: 1}, {name: "paper", value: 2}, {name: "scissors", value: 3})
                    .setRequired(true)),
	    async execute(interaction) {
            const targetUser = interaction.options.getUser("target");
            const weapon = interaction.options.getInteger("weapon");
            const bet = interaction.options.getInteger("bet");
            const { rpsRooms } = interaction.client
            const { gameData } = interaction.client
            const userGame = gameData.get(interaction.user.id);
            userGame.gold -= bet;

            let winner;
            if(rpsRooms.has(targetUser.id) && rpsRooms.get(targetUser.id).targetUser === interaction.user.id){
                const room = rpsRooms.get(targetUser.id);
                const roomGame = gameData.get(targetUser.id);
                const maxBet = Math.min(bet, room.bet);
                if((weapon - room.weapon) === 0){
                    userGame.gold += bet;
                    roomGame.gold += room.bet;

                }
                else if((weapon + 2) % 3 === room.weapon % 3){
                    userGame.gold += (maxBet + bet);
                    roomGame.gold += (room.bet - maxBet);
                    winner = interaction.user.displayName;
                }
                else {
                    roomGame.gold += (room.bet + maxBet);
                    userGame.gold += (bet - maxBet);
                    winner = targetUser.displayName;
                }
                weaponString = weapon == 1 ? `rock` : weapon == 2 ? `paper` : `scissors`;
                weaponStringRoom = room.weapon == 1 ? `rock` : weapon == 2 ? `paper` : `scissors`;
                await interaction.reply({content: `\`${interaction.user.displayName}\` used ${weaponString}, \`${targetUser.displayName}\` used ${weaponStringRoom}\n${winner ? `\`${winner}\` won ${maxBet} gold!` : "its a draw!"}`})
                interaction.client.rpsRooms.rpsRooms = rpsRooms.filter((obj, key) => key != targetUser.id);
                updateLeaderBoards(interaction.client)
                saveGameData(interaction.client.gameData)
                return
            }
            interaction.reply({content: `\`${interaction.user.displayName}\` has challenged \`${targetUser.displayName}\` for ${bet} gold! use /rps \`${interaction.user.displayName}\` to accept their challenge!\nChallenge times out in <t:${Math.round((Date.now()+60000)/1000)}:R>`})
            const thisTime = Date.now();
            rpsRooms.set(interaction.user.id, {bet: bet, targetUser: targetUser.id, weapon: weapon, time: thisTime})
            return await new Promise(resolve => setTimeout( () =>{
                if(rpsRooms.has(interaction.user.id) && rpsRooms.get(interaction.user.id).time === thisTime){
                    interaction.client.rpsRooms = rpsRooms.filter((obj, key) => key != interaction.user.id);
                }
            }, 60000 )).catch(err => console.error(err));
        },
};