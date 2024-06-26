const fs = require('node:fs');
const { PermissionsBitField } = require('discord.js');
function saveGameData(gameData) {
    gameData.save();
    /* const data = JSON.stringify(Object.fromEntries(gameData), null, 2);
    fs.writeFile(`./persistantData/userData.json`,data, (err) => {
        if(err) console.error(err);
    }) */
}
function saveLeaderBoards(leaderboards) {
    const data = JSON.stringify(Object.fromEntries(leaderboards), null, 2);
    fs.writeFile(`./persistantData/leaderBoards.json`,data, (err) => {
        if(err) console.error(err);
    })
}
function makeLeaderString(gameData){
    let string = "### Leaderboard:\n";
    gameData.sort((user1, user2) => (user2.gold + user2.banks * 1000) - (user1.gold + user1.banks * 1000))
    let index = 1;
    gameData.each(obj => {
        if(obj)
            string += `**${index++}.** **${obj.name}**   -   ${obj.gold} 🪙  :  ${obj.banks} 🏦\n`;
    });
    return string;
}
async function updateLeaderBoards(client) {
    const newLeaderBoard = makeLeaderString(client.gameData)
    try {
        client.leaderBoards.each(async (obj, err) => {
        try {
            const channel = await client.channels.fetch(obj.channel);
            try {
                if(channel.permissionsFor(client.application.id).has([
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages
                ])) {
                    const message = await channel.messages.fetch(obj.id);
                    message.edit(newLeaderBoard);
                }
                
            } catch (error) {
                console.error(error)
            }



        } catch(err) {
        client.leaderBoards.sweep(badobj => badobj === obj);
        saveLeaderBoards(client.leaderBoards)
        console.log(`Failed to fetch message in channel ${obj.channel} with message id ${obj.id} stopped trying to update this leaderboard`)
        }
    })} catch(err) {console.error(err)}
    console.log("updated leaderboards");
}

class player {
	name = "John Doe";
	gold = 1000;
	banks = 0;
	prays = 0;
	totalLosses = 0;
	prayTotal = 0;
	totalWinnings = 0;
	failedPrayers = 0;
    highestBlackjackWin = 0;
    highestRouletteWin = 0;
    timeLastRob = 0;
    goldDonated = 0;
    log = "\n**Log:**";
	constructor(obj){
        for(const property in obj){
            try {
                this[property] = obj[property];
            }
            catch(error) {
                console.error("You probably missnamed the property somewhere you dum fuck");
                console.error(error);
            }
        }
	}
    addWinnings(winnings){
        this.gold += Math.round(winnings);
        this.totalWinnings += Math.round(winnings);
    }
    addPray(amount = 100, successful = true){
        this.prays++;
        if(!successful) this.failedPrayers++;
        if(successful) {
            this.prayTotal += amount;
            this.gold += amount;
        }
    }
    toString(){
        const fullChanceTime = 24;
        const startChance = 0.5;
        const timeSinceLastRob = Math.min((Date.now() - this.timeLastRob)/(1000*60*60), fullChanceTime);
        const timeChanceMultiplier = startChance + (timeSinceLastRob * (1 - startChance)) / fullChanceTime
        return (
        `🪙 : ${this.gold} \n` +
        `🏦 : ${this.banks}\n` +
        `**Failed Prayers:** ${this.failedPrayers}\n` +
        `**Successfull Prayers:** ${this.prays - this.failedPrayers}\n` +
        `**Blessings from god:** ${this.prayTotal}\n` +
        `**Total Winnings:** ${this.totalWinnings}\n` +
        `**Total Losses:** ${this.totalLosses}\n` +
        `**Max rob chance:** <t:${Math.floor((this.timeLastRob + 24*60*60*1000)/1000)}:R>\n` +
        `**Current rob multiplier:** ${Math.floor(timeChanceMultiplier*100)}%`
        )
    }
    addLog(loggedData) {
        this.log += `\n[${(new Date(Date.now()).toLocaleString())}] ${loggedData}`
    }
    clearLog(){
        this.log = "\n**Log:**";
    }
}
const {typicalFailureResponses} = require("./finaFilen.json")
/**
 * @returns {string} Random message intendend for a failed gamble
 */
function randomFailMessage() {
    return typicalFailureResponses[Math.floor(Math.random()*typicalFailureResponses.length)]
}
module.exports = {
    randomFailMessage,
    player,
    saveGameData,
    saveLeaderBoards,
    makeLeaderString,
    updateLeaderBoards
}