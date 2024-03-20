const { jackPot } = require("/persistantData/otherData.json")
const fs = require('node:fs');
function saveGameData(gameData) {
    const data = JSON.stringify(Object.fromEntries(gameData));
    fs.writeFile(`./persistantData/userData.json`,data, (err) => {
        if(err) console.error(err);
    })
}
function saveLeaderBoards(leaderboards) {
    const data = JSON.stringify(Object.fromEntries(leaderboards));
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
            const message = await channel.messages.fetch(obj.id);
            message.edit(newLeaderBoard);
        } catch(err) {
        client.leaderBoards.sweep(badobj => badobj === obj);
        saveLeaderBoards(client.leaderBoards)
        console.log(`Failed to fetch message in channel ${obj.channel} with message id ${obj.id} stopped trying to update this leaderboard`)
        }
    })} catch(err) {console.error(err)}
    console.log("updated leaderboards");
}

class player {
	name;
	gold = 1000;
	banks = 0;
	prays = 0;
	totalLosses = 0;
	prayTotal = 0;
	totalWinnings = 0;
	failedPrayers = 0;
    highestBlackjackWin = 0;
    highestRouletteWin = 0;
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
        this.winnings += Math.round(winnings);
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
        return (
        `🪙 : ${this.gold} \n` +
        `🏦 : ${this.banks}\n` +
        `**Failed Prayers:** ${this.failedPrayers}\n` +
        `**Successfull Prayers:** ${this.prays - this.failedPrayers}\n` +
        `**Blessings from god:** ${this.prayTotal}\n` +
        `**Total Winnings:** ${this.totalWinnings}\n` +
        `**Total Losses:** ${this.totalLosses}`
        )
    }
}

module.exports = {
    player,
    saveGameData,
    saveLeaderBoards,
    makeLeaderString,
    updateLeaderBoards
}