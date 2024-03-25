const { SlashCommandBuilder, Collection, ActivityType, ButtonBuilder, ButtonStyle, ActionRow, ActionRowBuilder, messageLink, Component} = require('discord.js');
const { saveGameData, updateLeaderBoards } = require('../../funcs.js');
const { rouletteWaitTime, standardBotActivity } = require('../../finaFilen.json');
const { cardsFormated, cardFlags, cardGame } = require("../../cards.js");
const interactionCreate = require('../../events/interactionCreate.js');
const cardValues = [11,2,3,4,5,6,7,8,9,10,10,10,10];

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
    for(let i = 0; i < aces; i++) {
        if((aceValue + value) <= 21 ){
            value += aceValue;
            return value;
        }
        aceValue -= (cardValues[0]-1);
    }
    value += aceValue;
    return value;
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
            const { blackJackDecks, blackjackReshuffleLimit } = require('../../finaFilen.json')
            const userGame = gameData.get(interaction.user.id);
            const bet = interaction.options.getInteger("bet");
            if(userGame.gold < bet) return await interaction.reply({content: `You can't afford that bet`, ephemeral: true})
            const targetUser = interaction.options.getUser("joinplayer");

        
            if(targetUser){
                const othertable = interaction.client.blackJackTables.get(targetUser.id);
                if(othertable){
                    if(!othertable.playing){
                        interaction.client.blackJackTables.get(targetUser.id).players.push({name: interaction.user.displayName, id: interaction.user.id, bet: bet, hand: [], split: [], status: "", splitStatus: ""})
                        return await interaction.reply({content: `${interaction.user.displayName} joined ${targetUser.displayName}!`, ephemeral: false})
                    }
                    else return await interaction.reply({content: `${targetUser.displayName} has already started the room!`, ephemeral: true})
                }
                else return await interaction.reply({content: `It doesn't seem like ${targetUser.displayName} has a table!`, ephemeral: true})
            }
            table = new cardGame(blackJackDecks, blackjackReshuffleLimit);
            table.interaction = interaction;
            table.message = null;
            table.playing = false;
            table.closeTable = async () => {
                await table.message.edit({content: `This Blackjack table has closed!\nUse \`/blackjack\` to create a new one!`, components: []})
                table.interaction.client.blackJackTables.sweep((room, key) => key === table.interaction.user.id);
            }
            table.toString = (showfullDealerHand = false) => {
                let tableString = "Dealer:  ";
                showfullDealerHand ? tableString += `${handToString(table.dealerHand)}` : tableString += `${cardsFormated[table.dealerHand[0]]}`;
                tableString += `  remaining cards: ${table.deck.length}\n`
                table.players.forEach(player => {
                    tableString += `\n${player.name}:  ${handToString(player.hand)} ${player.status}  bet: ${player.bet} 🪙`
                    if(player.split.length) tableString += `\n${player.name} split hand:  ${handToString(player.split)} ${player.splitStatus}  bet: ${player.bet} 🪙`
                })
                return tableString;
            }
            interaction.client.blackJackTables.set(interaction.user.id, {playing: table.playing, players: table.players})
            table.players.push({name: interaction.user.displayName, id: interaction.user.id, bet: bet, hand: [], split: [], status: "", splitStatus: ""})
            table.message = await interaction.reply({content: `## BlackJack\n**Use /blackjack targetuser: ${interaction.user.displayName} to join!**`, components: [mainMenu]});
            
            let playAgain = true;
            while(playAgain){
                //clear decks and add to used cards
                table.playing = false;
                table.clearAllCards();
                table.players.forEach(player => {
                    table.usedCards = table.usedCards.concat(player.split);
                    player.split.splice(0,player.split.length);
                })
                //wait for button input
                let respons;
                try {
                    let start = false;
                    while(!start){
                        respons = await table.message.awaitMessageComponent({time: 60_000})
                        if(respons.customId == "start" && table.players.some(player => player.id === respons.user.id)) {
                            table.players.forEach(( player, index )=> {
                                player.status = "";
                                player.splitStatus = "";
                                const playerGame = gameData.get(player.id);
                                if(playerGame.gold < player.bet) table.players.splice(index, 1)
                                else playerGame.gold -= player.bet;
                            })
                            start = true;
                            table.playing = true;
                        } else await respons.update({content: table.message.content, components: table.message.components});
                        if(respons.customId == "leave") {
                            table.players.forEach((player, index) => {
                                if(player.id === respons.user.id) {
                                    table.players.splice(index, 1);
                                }
                            })
                        }
                        if(table.players.length === 0) {
                            await table.closeTable();
                            return;
                        }
                    }
                } catch(error) {
                    console.log("button timed out")
                    await table.closeTable();
                    return
                }
                table.playing = true;
                
                table.drawCards(table.dealerHand, 2);
                table.players.forEach(player => table.drawCards(player.hand, 2));

                let playingPlayers = table.players.length;
                if(handValue(table.dealerHand) == 21) {
                    table.players.forEach(player => {
                        const playerGame = gameData.get(player.id);
                        if(handValue(player.hand)  == 21){
                            playerGame.gold += player.bet;
                            player.status = "tied the dealer";
                        }
                        else {
                            player.status = "lost against the dealer";
                            playerGame.totalLosses += player.bet;
                            const jackPot = interaction.client.otherData.get("jackPot")
                            interaction.client.otherData.set("jackPot", jackPot + player.bet)
                        }
                        playingPlayers--;
                    })
                }
                else {
                    table.players.forEach((player) => {
                        if(handValue(player.hand) == 21) {
                            blackJack = true;
                            const playerGame = gameData.get(player.id);
                            playerGame.addWinnings(Math.round(player.bet * 3));
                            if(playerGame.highestBlackjackWin < (player.bet * 3)) playerGame.highestBlackjackWin = (player.bet * 3);
                            player.status = `Blackjack! won ${player.bet * 3} 🪙`
                            playingPlayers--;
                        }
                    })
                }
                if(playingPlayers == 0) {
                    saveGameData(gameData);
                    updateLeaderBoards(interaction.client);
                    await respons.update({content: `${table.toString(true)}\n**Use /blackjack targetuser: ${interaction.user.displayName} to join!**`, components: [mainMenu]});
                    continue;
                }
                await respons.update(table.toString(false));
                //round loops
                for(const index in table.players) {
                    const player = table.players[index];
                    let status = "";
                    if(handValue(player.hand) < 21){
                        doubleButton.setDisabled(false);
                        if(cardValues[player.hand[0] % 13] == cardValues[player.hand[1] % 13]){ splitButton.setDisabled(false);}
                        let stand = false;
                        table.message.edit({content: `${table.toString(false)} \nPlayerTurn: ${player.name}\n${status}`, components: [buttons]})
                        let firstCall = true;
                        while(!stand){
                            try {
                                const buttonPressed = await table.message.awaitMessageComponent({ filter: (interaction => interaction.user.id === player.id), time: 60_000 });

                                if(buttonPressed.customId == "stand") {
                                    stand = true;
                                    status = "stood";
                                }
                                if(buttonPressed.customId == "put") {
                                    table.drawCards(player.hand, 1)
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
                                if(buttonPressed.customId == "split" && firstCall && cardValues[player.hand[0] % 13] == cardValues[player.hand[1] % 13]) {
                                    const playerGame = gameData.get(player.id);
                                    if(playerGame.gold >= player.bet) {
                                    firstCall = false;
                                    player.split.push(player.hand[0]);
                                    player.hand.splice(0,1);
                                    table.drawCards(player.hand, 1)
                                    table.drawCards(player.split, 1)
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
                                        table.drawCards(player.hand, 1);
                                        stand = true;
                                        if(handValue(player.hand) > 21) {
                                            player.status = "went Bust!";
                                            status = "went Bust!";
                                            const jackPot = interaction.client.otherData.get("jackPot")
                                            interaction.client.otherData.set("jackPot", jackPot + player.bet)
                                        }
                                    }
                                }
                                if(handValue(player.hand) == 21) { stand = true; }
                                doubleButton.setDisabled(true);
                                splitButton.setDisabled(true);
                                firstCall = false;
                                await buttonPressed.update({content: `${table.toString(false)} \nPlayerTurn: ${player.name}\n${status}`, components: [buttons]})
                            } catch(error) {stand = true; console.log(`${player.name} timed out`)}
                        }
                    }
                    splitButton.setDisabled(true);
                    doubleButton.setDisabled(true);
                    if((player.split.length > 0)) {
                        try {
                            await table.message.edit({content: `${table.toString(false)} \nPlayerTurn: ${player.name} splithand\n${status}`, components: [buttons]})
                            stand = false;
                            while(!stand){
                                const buttonPressed = await table.message.awaitMessageComponent({ filter: (interaction => interaction.user.id === player.id), time: 60_000 });
                                if(buttonPressed.customId == "stand") {
                                    stand = true;
                                    status = "stood";
                                }
                                if(buttonPressed.customId == "put") {
                                    table.drawCards(player.split, 1)
                                    let status = "drew a card.";
                                    if(handValue(player.split) > 21) {
                                        stand = true;
                                        playerGame = gameData.get(player.id);
                                        playerGame.totalLosses += player.bet;
                                        player.splitStatus = "went Bust!";
                                        status = "went Bust!";
                                        const jackPot = interaction.client.otherData.get("jackPot")
                                        interaction.client.otherData.set("jackPot", jackPot + player.bet)
                                    }
                                    if(handValue(player.split) == 21) {
                                        stand = true;
                                        status = "got 21!";
                                    } 
                                    await buttonPressed.update({ content: `${table.toString(false)}\n${player.name} ${status}`, components: [buttons] });
                                }
                            }
                        } catch(error){stand = true; console.log(`${player.name} timed out`);}
                    }
                }
                //dealer card Draw
                while(handValue(table.dealerHand) < 17) table.drawCards(table.dealerHand, 1);
                
                //cardchecking 
                for(const index in table.players) {
                    const player = table.players[index];
                    const playerGame = gameData.get(player.id);
                    console.log(player.hand)
                    console.log(handToString(player.hand))
                    console.log(handValue(player.hand))
                    console.log(table.dealerHand)
                    console.log(handToString(table.dealerHand))
                    console.log(handValue(table.dealerHand))
                    if((handValue(player.hand) > handValue(table.dealerHand) && !player.status) || (handValue(table.dealerHand) > 21 && !player.status)) {
                        playerGame.addWinnings(player.bet * 2);
                        if(playerGame.highestBlackjackWin < (player.bet * 2)) playerGame.highestBlackjackWin = (player.bet * 2);
                        player.status = `won ${player.bet * 2} 🪙`
                    }
                    else if(handValue(player.hand) == handValue(table.dealerHand) && !player.status) {
                        playerGame.gold += player.bet;
                        player.status = `tied the dealer`
                    }
                    else if(handValue(player.hand) < handValue(table.dealerHand) && !player.status) {
                        player.status = `lost against the dealer`
                        playerGame.totalLosses += player.bet;
                        const jackPot = interaction.client.otherData.get("jackPot")
                        interaction.client.otherData.set("jackPot", jackPot + player.bet)
                    }
                    if(player.split.length) {
                        if((handValue(player.split) > handValue(table.dealerHand) && !player.splitStatus) || handValue(table.dealerHand) > 21 && !player.splitStatus) {
                            playerGame.addWinnings(player.bet * 2);
                            if(playerGame.highestBlackjackWin < (player.bet * 2)) playerGame.highestBlackjackWin = (player.bet * 2);
                            player.splitStatus = `won ${player.bet * 2} 🪙`
                        }
                        else if(handValue(player.split) == handValue(table.dealerHand) && !player.splitStatus) {
                            playerGame.gold += player.bet;
                            player.splitStatus = `tied the dealer`
                        }
                        else if(handValue(player.split) < handValue(table.dealerHand) && !player.splitStatus) {
                            player.splitStatus = `lost against the dealer`
                            playerGame.totalLosses += player.bet;
                            const jackPot = interaction.client.otherData.get("jackPot")
                            interaction.client.otherData.set("jackPot", jackPot + player.bet)
                        }
                    }
                }
                updateLeaderBoards(interaction.client);
                gameData.save()
                interaction.client.otherData.save()
                table.playing = false;
                try {
                await table.message.edit({content: `${table.toString(true)}\n**Use /blackjack targetuser: ${interaction.user.displayName} to join!**`, components: [mainMenu]});
                } catch (err) {console.error(err)}
            }
    },
};