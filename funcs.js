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
	constructor(obj){
		this.name = obj.name;
		this.gold = (obj.gold ?? 1000);
		this.banks = (obj.banks ?? 0);
		this.prays = (obj.prays ?? 0);
		this.totalLosses = (obj.totalLosses ?? 0);
		this.prayTotal = (obj.prayTotal ?? 0);
		this.totalWinnings = (obj.totalWinnings ?? 0);
		this.failedPrayers = (obj.failedPrayers ?? 0);
	}
    addWinnings(winnings){
        this.gold += winnings;
        this.winnings += winnings;
    }
    addPray(amount = 100, successful = true){
        this.prays++;
        if(!successful) this.failedPrayers++;
        if(successful) {
            this.prayTotal += amount;
            this.gold += amount;
        }
    }
}

module.exports = {
    player,
    saveGameData,
    saveLeaderBoards,
    makeLeaderString,
    updateLeaderBoards
}