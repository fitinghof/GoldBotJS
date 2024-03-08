const { SlashCommandBuilder, Collection, ActivityType, ButtonBuilder, ButtonStyle, ActionRow, ActionRowBuilder, messageLink, Component} = require('discord.js');
const { saveGameData, updateLeaderBoards } = require('../../funcs');
const { rouletteWaitTime, standardBotActivity } = require('../../finaFilen.json');
const { cardsFormated, cardFlags } = require("../../cards.js");
const interactionCreate = require('../../events/interactionCreate.js');
const cardValues = [11,2,3,4,5,6,7,8,9,10,10,10,10];

function drawCards(hand, deck, nrOfCards = 1){
    for(let i = 0; i < nrOfCards; i++){
        dealtCard = Math.floor(Math.random() * deck.length);
        hand.push(deck[dealtCard]);
        deck.splice(dealtCard, 1);
    }
    return hand;
}
function handToString(hand) {
    return hand.reduce((accumulator, currentvalue) => accumulator += (cardsFormated[currentvalue] + " "), "" )
}
function handValue(hand){
    let value = 0;
    let aces = 0;
    hand.forEach(card => {
        const cardnum = card % 13;
        if(cardnum == 0) {aces += 1}
        else {value += cardValues[cardnum]}
    })
    let aceValue = aces * cardValues[0];
    for(let i = 0; i <= aces; i++) {
        aceValue -= (cardValues[0]-1)*i;
        if((aceValue + value) <= 21 ){
            value += aceValue;
            return value;
        }
    }
    value += aceValue;
    return value;
}

function tableToString(dealerHand, players, showfullDealerHand = false){

    let tableString = "Dealer:  ";
    showfullDealerHand ? tableString += `${handToString(dealerHand)} ${handValue(dealerHand) == 21 ? `BlackJack!` : ``}\n` : tableString += `${cardsFormated[dealerHand[0]]}\n`;
    players.forEach(player => {
        tableString += `\n${player.name}:  ${handToString(player.hand)}${handValue(player.hand) == 21 ? ` BlackJack! ` : ``}${player.split.length ? ` ||  ${handToString(player.split)}${handValue(player.split) == 21 ? ` BlackJack! ` : ``}` : ``}, bet: ${player.bet} 🪙`;
    })
    return tableString;
}

const putButton = new ButtonBuilder()
    .setCustomId("put")
    .setLabel("Put")
    .setStyle(ButtonStyle.Primary);

const standButton = new ButtonBuilder()
.setCustomId("stand")
.setLabel("Stand")
.setStyle(ButtonStyle.Primary);

const splitButton = new ButtonBuilder()
.setCustomId("split")
.setLabel("Split")
.setStyle(ButtonStyle.Primary);

const doubleButton = new ButtonBuilder()
.setCustomId("double")
.setLabel("Double")
.setStyle(ButtonStyle.Primary);

const buttons = new ActionRowBuilder()
.addComponents(putButton, standButton, splitButton, doubleButton);
module.exports = {
    category: 'gambling',
	data: new SlashCommandBuilder()
		.setName('blackjack')
		.setDescription(`Gamble gold`)
        .addIntegerOption(option =>
            option.setName("bet")
            .setDescription("How much to bet")
            .setMinValue(1)
            .setRequired(true)),
	    async execute(interaction) {
            const { gameData } = interaction.client;
            const nrOfDecks = 6;
            const userGame = gameData.get(interaction.user.id);
            const bet = interaction.options.getInteger("bet");
            if(userGame.gold < bet) return await interaction.reply({content: `You can't afford that bet`, ephemeral: true})
            userGame.gold -= bet;

            let deck = new Array();
            for(let i = 0; i < nrOfDecks; i++) cardFlags.each(element => deck.push(element));

            const dealerHand = new Array();
            const players = new Array()
            players.push({name: interaction.user.displayName, id: interaction.user.id, bet: bet, hand: new Array(), split: new Array, status: "playing"})

            drawCards(dealerHand, deck);
            
            players.forEach(player => drawCards(player.hand, deck, 2));

            message = await interaction.reply(tableToString(dealerHand, players));

            drawCards(dealerHand, deck);

            let playingPlayers = players.length;
            if(handValue(dealerHand) == 21) {
                blackJack = true;
                players.forEach(player => {
                    if(handValue(player.hand)  == 21){
                        const userGame = gameData.get(player.id);
                        userGame.gold += player.bet;
                    }
                    playingPlayers--;
                })
            }
            else {
                players.forEach((player) => {
                    if(handValue(player.hand) == 21) {
                        blackJack = true;
                        const userGame = gameData.get(player.id);
                        userGame.gold += Math.round(player.bet * 3.5);
                        playingPlayers--;
                    }
                })
            }
            message.edit(tableToString(dealerHand, players, !playingPlayers));
            if(!playingPlayers) {
                updateLeaderBoards(interaction.client);
                return;
            }

            //round loops
            for(const key in players) {
                const player = players[key];
                if(handValue(player.hand) < 21){
                    if(player.hand.length == 2){
                        if(player.hand[0] % 13 == player.hand[1] % 13){
                            splitButton.setDisabled(false);
                        }
                        doubleButton.setDisabled(false);
                    }
                    try {
                        message.edit({content: `${tableToString(dealerHand, players)} \nPlayerTurn: ${players[0].name}`, components: [buttons]})
                    } catch(error){/*Do sometink*/};
                    let stand = false;
                    let firstCall = false;
                    while(!stand){
                        try {
                            const buttonPressed = await message.awaitMessageComponent({ filter: (interaction => interaction.user.id === player.id), time: 60_000 });
                            if(buttonPressed.customId == "stand") {
                                stand = true;
                                await buttonPressed.update({ content: `${tableToString(dealerHand, players)}\n${player.name} stood`, components: [buttons] });
                            }
                            if(buttonPressed.customId == "put") {
                                drawCards(player.hand, deck, 1)
                                let status = "drew a card.";
                                console.log(handValue(player.hand))
                                if(handValue(player.hand) > 21) {
                                    stand = true;
                                    player.status = "went Bust!";
                                    status = "went Bust!";
                                }
                                if(handValue(player.hand) == 21) {
                                    gameData.get(player.id).gold += (player.split ? player.bet * 2 : player.bet * 3.5);
                                    stand = true;
                                    player.status = "got BlackJack!";
                                    status = "got BlackJack!";
                                } 
                                await buttonPressed.update({ content: `${tableToString(dealerHand, players)}\n${player.name} ${status}`, components: [buttons] });
                            }
                            if(buttonPressed.customId == "split" && !firstCall && player.hand[0] % 13 == player.hand[1] % 13) {
                                firstCall = true;
                                player.split.push(player.hand[0]);
                                player.hand.splice(0,1);
                                await buttonPressed.update({ content: `${tableToString(dealerHand, players)}\n${player.name} split`, components: [buttons] });
                            }
                            if(buttonPressed.customId == "double") {
                                playerGame = gameData.get(player.id);
                                let status = "You cannot double here";
                                if(playerGame.gold >= player.bet) {
                                    status = "doubled"
                                    const playerGame = gameData.get(player.id);
                                    playerGame.gold -= bet;
                                    player.bet *= 2;
                                    drawCards(player.hand, deck, 1);
                                    stand = true;
                                    if(handValue(player.hand) > 21) {
                                        player.status = "went Bust!";
                                        status = "went Bust!";
                                    }
                                }
                                await buttonPressed.update({ content: `${tableToString(dealerHand, players)}\n${player.name} ${status}`, components: [buttons] });
                            }
                            if(handValue(player.hand) == 21) {
                                gameData.get(player.id).gold += (player.split ? player.bet * 2 : player.bet * 3.5);
                                stand = true;
                            }
                        } catch(error) {stand = true; console.log(`${player.name} timed out`)}
                    }
                }
                splitButton.setDisabled(true);
                doubleButton.setDisabled(true);
                if(player.split.length && handValue(player.split) < 21) {
                    try {
                        message.edit({content: `${tableToString(dealerHand, players)} PlayerTurn: ${players[0].name}`, components: [buttons]})
                        let stand = false;
                        while(!stand){
                            const buttonPressed = await message.awaitMessageComponent({ filter: (interaction => interaction.user.id === player.id), time: 60_000 });
                            if(buttonPressed.customId == "stand") {
                                stand = true;
                            }
                            if(buttonPressed.customId == "put") {
                                drawCards(player.split, deck, 1)
                            }
                            if(handValue(player.hand) > 21) stand = true;
                            if(handValue(player.hand) == 21) {
                                gameData.get(player.id).gold += (player.split ? player.bet * 2 : player.bet * 3.5);
                                stand = true;
                            }
                        }
                    } catch(error){stand = true; console.log(`${player.name} timed out`);}
                }
            }
            while(handValue(dealerHand) < 17) drawCards(dealerHand, deck, 1);
            let winnersString = "";

            if(handValue(dealerHand) > 21) {
                for(const index in players) {
                    const player = players[index];
                    const playerGame = gameData.get(player.id);
                    playerGame.gold += player.bet * 2;
                    if(player.split.length && handValue(player.split) <= 21) {
                        playerGame.gold += player.bet * 2;
                        winnersString += `${player.name} won ${player.bet * 4} 🪙\n`;
                    } else winnersString += `${player.name} won ${player.bet * 2} 🪙\n`;
                }
            }
            for(const index in players) {
                const player = players[index];
                const playerGame = gameData.get(player.id);
                if(handValue(player.hand) > handValue(dealerHand) && handValue(player.hand) < 21) {
                    playerGame.gold += player.bet * 2;
                    winnersString += `${player.name} won ${player.bet * 2} 🪙\n`;
                }
                else if (handValue(player.hand) == handValue(dealerHand) && handValue(player.hand) < 21) {
                    winnersString += `${player.name} tied \n`;
                    playerGame.gold += player.bet;
                }
                if(!player.split.length) break;
                if(handValue(player.split) > handValue(dealerHand) && handValue(player.hand) < 21) {
                    winnersString += `${player.name} splithand won ${player.bet * 2} 🪙\n`;
                    playerGame.gold += player.bet * 2;
                }
                else if (handValue(player.split) == handValue(dealerHand) && handValue(player.hand) < 21) {
                    winnersString += `${player.name} splithand tied \n`;
                    playerGame.gold += player.bet;
                }
            }
            updateLeaderBoards(interaction.client);
        return await interaction.editReply({content: `${tableToString(dealerHand, players, 1)}\n${winnersString ? winnersString : `No one won`}`, components: []});
    },
};