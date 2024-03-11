const { SlashCommandBuilder, Collection, ActivityType, ButtonBuilder, ButtonStyle, ActionRow, ActionRowBuilder, messageLink, Component} = require('discord.js');
const { saveGameData, updateLeaderBoards } = require('../../funcs');
const { rouletteWaitTime, standardBotActivity } = require('../../finaFilen.json');
const { cardsFormated, cardFlags, cardGame } = require("../../cards.js");
const interactionCreate = require('../../events/interactionCreate.js');
const cardValues = [11,2,3,4,5,6,7,8,9,10,10,10,10];

function drawCards(hand, deck, nrOfCards = 1, usedCards){
    for(let i = 0; i < nrOfCards; i++){
        dealtCard = Math.floor(Math.random() * deck.length);
        hand.push(deck[dealtCard]);
        deck.splice(dealtCard, 1);
        if(deck.length < 92 ){
            deck = deck.concat(usedCards);
        }
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

function tableToString(dealerHand, players, showfullDealerHand = false, deck) {
    let tableString = "Dealer:  ";
    showfullDealerHand ? tableString += `${handToString(dealerHand)}` : tableString += `${cardsFormated[dealerHand[0]]}`;
    tableString += `  remaining cards: ${deck.length}\n`
    players.forEach(player => {
        tableString += `\n${player.name}:  ${handToString(player.hand)} ${player.status}  bet: ${player.bet} 🪙`
        if(player.split.length) tableString += `\n${player.name} split hand:  ${handToString(player.split)} ${player.splitStatus}  bet: ${player.bet} 🪙`
    })
    return tableString;
}

const putButton = new ButtonBuilder()
.setCustomId("put")
.setLabel("Put")
.setStyle(ButtonStyle.Success);

const standButton = new ButtonBuilder()
.setCustomId("stand")
.setLabel("Stand")
.setStyle(ButtonStyle.Secondary);

const splitButton = new ButtonBuilder()
.setCustomId("split")
.setLabel("Split")
.setDisabled(true)
.setStyle(ButtonStyle.Primary);

const doubleButton = new ButtonBuilder()
.setCustomId("double")
.setLabel("Double")
.setDisabled(true)
.setStyle(ButtonStyle.Danger);

const startButton = new ButtonBuilder()
.setCustomId("start")
.setLabel("Start")
.setStyle(ButtonStyle.Success);

const leaveButton = new ButtonBuilder()
.setCustomId("leave")
.setLabel("Leave")
.setStyle(ButtonStyle.Danger);

const buttons = new ActionRowBuilder()
.addComponents(putButton, standButton, splitButton, doubleButton);
const mainMenu = new ActionRowBuilder()
.addComponents(startButton, leaveButton);
module.exports = {
    category: 'gambling',
	data: new SlashCommandBuilder()
		.setName('blackjack')
		.setDescription(`Gamble gold`)
        .addIntegerOption(option =>
            option.setName("bet")
            .setDescription("How much to bet")
            .setMinValue(1)
            .setRequired(true))
        .addUserOption(option => 
            option.setName("joinplayer")
            .setDescription("Allows you to join another players blackjack table, recommended to prevent spam.")),
	    async execute(interaction) {
            const { gameData } = interaction.client;
            const { blackJackDecks } = require('../../finaFilen.json')
            const userGame = gameData.get(interaction.user.id);
            const bet = interaction.options.getInteger("bet");
            if(userGame.gold < bet) return await interaction.reply({content: `You can't afford that bet`, ephemeral: true})
            const targetUser = interaction.options.getUser("joinplayer");

            async function closeTable(message, interaction) {
                await message.edit({content: `Blackjack table has closed!`, components: []})
                interaction.client.blackJackTables.sweep((table, key) => key === interaction.user.id);
                console.log(interaction.client.blackJackTables);
            }
            
            if(targetUser){
                const table = interaction.client.blackJackTables.get(targetUser.id);
                if(table){
                    if(!table.playing){
                        interaction.client.blackJackTables.get(targetUser.id).players.push({name: interaction.user.displayName, id: interaction.user.id, bet: bet, hand: [], split: [], status: "", splitStatus: ""})
                        return await interaction.reply({content: `You joined ${targetUser.displayName}!`, ephemeral: true})
                    }
                    else return await interaction.reply({content: `${targetUser.displayName} has already started the room!`, ephemeral: true})
                }
                else return await interaction.reply({content: `It doesn't seem like ${targetUser.displayName} has a table!`, ephemeral: true})
            }

            let deck = new Array();
            let usedCards = new Array();
            for(let i = 0; i < blackJackDecks; i++) cardFlags.each(element => deck.push(element));
            const dealerHand = new Array();
            const players = new Array();
            const table = interaction.client.blackJackTables.set(interaction.user.id, {playing: false, players: players})
            players.push({name: interaction.user.displayName, id: interaction.user.id, bet: bet, hand: [], split: [], status: "", splitStatus: ""})
            const message = await interaction.reply({content: `## BlackJack\n**Use /blackjack targetuser: ${interaction.user.displayName} to join!**`, components: [mainMenu]});
            const playAgain = true;

            while(playAgain){
                //clear decks and add to used cards
                usedCards = usedCards.concat(dealerHand);
                dealerHand.splice(0, dealerHand.length);

                players.forEach(( player, index )=> {
                    usedCards = usedCards.concat(player.hand).concat(player.split)
                    player.hand.splice(0, player.hand.length);
                    player.split.splice(0, player.split.length);
                    player.status = "";
                    player.splitStatus = "";
                    const playerGame = gameData.get(player.id);
                    if(playerGame.gold < player.bet) players.splice(index, 1)
                    else playerGame.gold -= player.bet;
                })
                //wait for button input
                let respons;
                try {
                    let start = false;
                    while(!start){
                        respons = await message.awaitMessageComponent({time: 60_000})
                        if(respons.customId == "start" && players.some(player => player.id === respons.user.id)) {
                            start = true;
                            table.playing = true;
                        } else await respons.update({content: message.content, components: message.components});
                        if(respons.customId == "leave") {
                            players.forEach((player, index) => {
                                if(player.id === respons.user.id) {
                                    const playerGame = gameData.get(player.id);
                                    playerGame.gold += player.bet;
                                    players.splice(index, 1);
                                }
                            })
                            if(players.length === 0) {
                                await closeTable(message, interaction);
                                return;
                            }
                        }
                    }
                } catch(error) {
                    console.log("button timed out")
                    players.forEach(player =>{
                        const playerGame = gameData.get(player.id);
                        playerGame.gold += player.bet;
                    })
                    await closeTable(message, interaction);
                    return
                }
                if(players.length == 0) { // this function is probably redundant
                    await closeTable(message, interaction);
                    return;
                }
                drawCards(dealerHand, deck, 2, usedCards);
                players.forEach(player => drawCards(player.hand, deck, 2, usedCards));

                let playingPlayers = players.length;
                if(handValue(dealerHand) == 21) {
                    blackJack = true;
                    players.forEach(player => {
                        if(handValue(player.hand)  == 21){
                            const playerGame = gameData.get(player.id);
                            playerGame.gold += player.bet;
                            player.status = "tied the dealer";
                        }
                        else player.status = "lost against the dealer";
                        playingPlayers--;
                    })
                }
                else {
                    players.forEach((player) => {
                        if(handValue(player.hand) == 21) {
                            blackJack = true;
                            const playerGame = gameData.get(player.id);
                            userGame.gold += Math.round(player.bet * 2.5);
                            player.status = `Blackjack! won ${player.bet * 2.5} 🪙`
                            playerGame.totalWinnings += (player.bet * 2.5);
                            playingPlayers--;
                        }
                    })
                }
                if(!playingPlayers) {
                    saveGameData(gameData);
                    updateLeaderBoards(interaction.client);
                    table.playing = false;
                    await respons.update({content: `${tableToString(dealerHand, players, true, deck)}\n**Use /blackjack targetuser: ${interaction.user.displayName} to join!**`, components: [mainMenu]});
                    try {
                        while(!playAgain){
                            menuRespons = await message.awaitMessageComponent({timer: 60_000})
                            if(menuRespons.customId == "start"){
                                playAgain = true;
                            }
                            if(menuRespons.customId == "leave"){
                                players.forEach((player, index) => {
                                    if(player.id === respons.user.id) {
                                        players.splice(index, 1);
                                    }
                                })
                                if(players.length === 0) {
                                    await closeTable(message, interaction);
                                    return;
                                }
                            }
                        }
                    } catch (error) {
                        playAgain = false;
                    }
                    continue;
                }
                await respons.update(tableToString(dealerHand, players, false, deck));
                //round loops
                for(const key in players) {
                    const player = players[key];
                    let status = "";
                    if(handValue(player.hand) < 21){
                        doubleButton.setDisabled(false);
                        if(cardValues[player.hand[0] % 13] == cardValues[player.hand[1] % 13]){ splitButton.setDisabled(false);}
                        let stand = false;
                        message.edit({content: `${tableToString(dealerHand, players, false, deck)} \nPlayerTurn: ${player.name}\n${status}`, components: [buttons]})
                        while(!stand){
                            try {
                                let firstCall = true;
                                const buttonPressed = await message.awaitMessageComponent({ filter: (interaction => interaction.user.id === player.id), time: 60_000 });

                                if(buttonPressed.customId == "stand") {
                                    stand = true;
                                    status = "stood";
                                }
                                if(buttonPressed.customId == "put") {
                                    drawCards(player.hand, deck, 1, usedCards)
                                    console.log(handValue(player.hand))
                                    if(handValue(player.hand) > 21) {
                                        stand = true;
                                        player.status = "went Bust!";
                                        status = "went Bust!";
                                        const playerGame = gameData.get(player.id);
                                        playerGame.totalLosses += player.bet;
                                    }
                                    if(handValue(player.hand) == 21) {
                                        stand = true;
                                        status = "got 21!";
                                    } 
                                }
                                if(buttonPressed.customId == "split" && firstCall && player.hand[0] % 13 == player.hand[1] % 13) {
                                    playerGame = gameData.get(player.id);
                                    if(playerGame.gold >= player.bet) {
                                    firstCall = false;
                                    player.split.push(player.hand[0]);
                                    player.hand.splice(0,1);
                                    drawCards(player.hand, deck, 1, usedCards)
                                    drawCards(player.split, deck, 1, usedCards)
                                    status = "split";
                                    } else status = "You couldn't afford to split!"

                                }
                                if(buttonPressed.customId == "double" && firstCall) {
                                    playerGame = gameData.get(player.id);
                                    let status = "You cannot double here";
                                    if(playerGame.gold >= player.bet) {
                                        status = "doubled"
                                        const playerGame = gameData.get(player.id);
                                        playerGame.gold -= bet;
                                        player.bet *= 2;
                                        drawCards(player.hand, deck, 1, usedCards);
                                        stand = true;
                                        if(handValue(player.hand) > 21) {
                                            player.status = "went Bust!";
                                            status = "went Bust!";
                                        }
                                    }
                                }
                                if(handValue(player.hand) == 21) { stand = true; }
                                doubleButton.setDisabled(true);
                                splitButton.setDisabled(true);
                                firstCall = false;
                                await buttonPressed.update({content: `${tableToString(dealerHand, players, false, deck)} \nPlayerTurn: ${player.name}\n${status}`, components: [buttons]})
                            } catch(error) {stand = true; console.log(`${player.name} timed out`)}
                        }
                    }
                    splitButton.setDisabled(true);
                    doubleButton.setDisabled(true);
                    if(player.split.length && handValue(player.split) < 21) {
                        try {
                            message.edit({content: `${tableToString(dealerHand, players, false, deck)} \nPlayerTurn: ${player.name} splithand\n${status}`, components: [buttons]})
                            let stand = false;
                            while(!stand){
                                const buttonPressed = await message.awaitMessageComponent({ filter: (interaction => interaction.user.id === player.id), time: 60_000 });
                                if(buttonPressed.customId == "stand") {
                                    stand = true;
                                }
                                if(buttonPressed.customId == "put") {
                                    drawCards(player.split, deck, 1, usedCards)
                                    let status = "drew a card.";
                                    if(handValue(player.split) > 21) {
                                        stand = true;
                                        playerGame = gameData.get(player.id);
                                        playerGame.totalLosses += player.bet;
                                        player.splitStatus = "went Bust!";
                                        status = "went Bust!";
                                    }
                                    if(handValue(player.split) == 21) {
                                        stand = true;
                                        status = "got 21!";
                                    } 
                                    await buttonPressed.update({ content: `${tableToString(dealerHand, players, false, deck)}\n${player.name} ${status}`, components: [buttons] });
                                }
                            }
                        } catch(error){stand = true; console.log(`${player.name} timed out`);}
                    }
                }
                //dealer card Draw
                while(handValue(dealerHand) < 17) drawCards(dealerHand, deck, 1, usedCards);
                
                //cardchecking 
                for(const index in players) {
                    const player = players[index];
                    const playerGame = gameData.get(player.id);
                    if((handValue(player.hand) > handValue(dealerHand) && !player.status) || (handValue(dealerHand) > 21 && !player.status)) {
                        playerGame.gold += (player.bet * 2);
                        playerGame.totalWinnings += (player.bet * 2);
                        player.status = `won ${player.bet * 2} 🪙`
                    }
                    else if(handValue(player.hand) == handValue(dealerHand) && !player.status) {
                        playerGame.gold += player.bet;
                        player.status = `tied the dealer`
                    }
                    else if(handValue(player.hand) < handValue(dealerHand) && !player.status) {
                        player.status = `lost against the dealer`
                        playerGame.totalLosses += player.bet;
                    }
                    if(player.split.length) {
                        if((handValue(player.split) > handValue(dealerHand) && !player.splitStatus) || handValue(dealerHand) > 21) {
                            playerGame.gold += (player.bet * 2);
                            playerGame.totalWinnings += (player.bet * 2);
                            player.splitStatus = `won ${player.bet * 2} 🪙`
                        }
                        else if(handValue(player.split) == handValue(dealerHand) && !player.splitStatus) {
                            playerGame.gold += player.bet;
                            player.splitStatus = `tied the dealer`
                        }
                        else if(handValue(player.split) < handValue(dealerHand) && !player.splitStatus) {
                            player.splitStatus = `lost against the dealer`
                            playerGame.totalLosses += player.bet;
                        }
                    }
                }
                updateLeaderBoards(interaction.client);
                saveGameData(gameData);
                table.playing = false;
                await message.edit({content: `${tableToString(dealerHand, players, true, deck)}\n**Use /blackjack targetuser: ${interaction.user.displayName} to join!**`, components: [mainMenu]});
                try {
                    while(!playAgain){
                        menuRespons = await message.awaitMessageComponent({timer: 60_000})
                        if(menuRespons.customId == "start"){
                            playAgain = true;
                        }
                        if(menuRespons.customId == "leave"){
                            players.forEach((player, index) => {
                                if(player.id === respons.user.id) {
                                    players.splice(index, 1);
                                }
                            })
                            if(players.length === 0) {
                                await closeTable(message, interaction);
                                return;
                            }
                        }
                    }
                } catch (error) {
                    playAgain = false;
                }
            }
    },
};