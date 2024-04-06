const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveGameData, updateLeaderBoards } = require('../../funcs');
const { bankCost, bankearnings, bankPeriodmin } = require('../../finaFilen.json');

const rock = new ButtonBuilder()
.setCustomId("rock")
.setLabel("Rock")
.setStyle(ButtonStyle.Danger);
const paper = new ButtonBuilder()
.setCustomId("paper")
.setLabel("Paper")
.setStyle(ButtonStyle.Success);
const scissors = new ButtonBuilder()
.setCustomId("scissors")
.setLabel("Scissors")
.setStyle(ButtonStyle.Primary);

const buttons = new ActionRowBuilder()
.addComponents(rock, paper, scissors)

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
            const targetUser = interaction.options.getUser("target")
            const weapon = interaction.options.getInteger("weapon")
            const bet = interaction.options.getInteger("bet")
            const { gameData } = interaction.client
            const userGame = gameData.get(interaction.user.id);
            const challengeTimeOutTime = 60 * 1000
            if(userGame.gold < bet) return interaction.reply({content:`Poor fuck`, ephemeral: true})
            userGame.gold -= bet;
            const player2Game = gameData.get(targetUser.id)
            if(!player2Game) return interaction.reply({content:`${targetUser.displayName} is homeless`, ephemeral: true})
            
            interaction.reply({content: `Challenge made!`, ephemeral: true})
            const message = await interaction.channel.send({
                content: `\`${interaction.user.displayName}\` has challenged ${targetUser} for ${bet}  🪙 !`+
                `\nChallenge times out <t:${Math.round((Date.now()+challengeTimeOutTime)/1000)}:R>\nPress a button to accept!`, components: [buttons]})
            let buttonInteraction
            try {
                buttonInteraction = await message.awaitMessageComponent({ filter: (interaction => interaction.user.id === targetUser.id), time: challengeTimeOutTime })
                if(player2Game.gold < bet) {
                    userGame.gold += bet
                    return buttonInteraction.update({content:`\`${targetUser.displayName}\` was practically speaking homeless.`, components: []})
                }
                player2Game.gold -= bet
            } catch(error) {
                try {
                    message.edit({content: `\`${targetUser.displayName}\` didn't join in time`, components: []})
                } catch(err) {console.error(err)}
                userGame.gold += bet
                return
            }
            const otherPlayerWeapon = buttonInteraction.customId === "rock" ? 1 : buttonInteraction.customId === "paper" ? 2 : 3
            let winner
            if((weapon - otherPlayerWeapon) === 0){
                userGame.gold += bet
                player2Game.gold += bet

            }
            else if((weapon + 2) % 3 === otherPlayerWeapon % 3){
                userGame.gold += bet * 2
                winner = interaction.user.displayName
            }
            else {
                player2Game.gold += bet * 2
                winner = targetUser.displayName;
            }
            weaponString = weapon == 1 ? `rock` : weapon == 2 ? `paper` : `scissors`
            weaponStringRoom = buttonInteraction.customId
            await message.edit({content: `\`${interaction.user.displayName}\` used ${weaponString}, \`${targetUser.displayName}\` used ${weaponStringRoom}\n${winner ? `\`${winner}\` won ${bet}  🪙 !` : "its a draw!"}\nUse \`/rps\` to play again!`, components:[]})
            updateLeaderBoards(interaction.client)
            saveGameData(interaction.client.gameData)
            return
        }

    }
