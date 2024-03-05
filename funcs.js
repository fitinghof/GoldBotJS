const fs = require('node:fs');
const interactionCreate = require('./events/interactionCreate');

function saveGameData(gameData, user) {
    const data = JSON.stringify(Object.fromEntries(gameData));
    fs.writeFile(`./persistantData/userData.json`,data, (err) => {console.error(err);})
}
function makeLeaderString(gameData){
    let string = "### Leaderboard:\n";
    gameData.sort((user1, user2) => user2.gold - user1.gold)
    let index = 1;
    gameData.each(obj => {
        if(obj)
            string += `**${index++}.** **${obj.name}**   -   ${obj.gold} 🪙\n`;
    });
    return string;
}
async function updateLeaderBoards(client) {
    const newLeaderBoard = makeLeaderString(client.gameData)
    try {client.leaderBoards.each(async (obj, err) => {
        const channel = await client.channels.fetch(obj.channel);
        const message = await channel.messages.fetch(obj.id);
        message.edit(newLeaderBoard);
    })} catch(err) {console.error(err)}
    console.log("updated leaderboards with:\n",newLeaderBoard);
}
function saveLeaderBoards(leaderboards) {
    const data = JSON.stringify(Object.fromEntries(leaderboards));
    fs.writeFile(`./persistantData/leaderBoards.json`,data, (err) => {console.error(err);})
}
module.exports = {
    saveGameData,
    saveLeaderBoards,
    makeLeaderString,
    updateLeaderBoards
}