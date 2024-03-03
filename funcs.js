const fs = require('node:fs');
const interactionCreate = require('./events/interactionCreate');

function saveGameData(gameData, user) {
    if(user) gameData.set(user.id, user.game)
    const data = JSON.stringify(Object.fromEntries(gameData));
    fs.writeFile(`C:/Users/fitin/Documents/Javascript/GoldBotJS/persistantData/userData.json`,data, (err) => {console.error(err);})
}
function makeLeaderString(gameData){
    let string = "## Leaderboard:\n";
    gameData.each(obj => {
        if(obj)
            string += `**${obj.name}**   -   ${obj.gold} 🪙\n`;
    });
    console.log(string);
    return string;
}
async function updateLeaderBoards(leaderBoards, gameData) {
    for(const key in leaderBoards){
        await leaderBoards[key].edit(makeLeaderString(gameData));
    }
    console.log("updated leaderboards with:\n",makeLeaderString(gameData));
}
function saveLeaderBoards(leaderboards) {
    //Object.fromEntries(gameData)
    const data = JSON.stringify(Object.fromEntries(leaderboards));
    fs.writeFile(`C:/Users/fitin/Documents/Javascript/GoldBotJS/persistantData/leaderBoards.json`,data, (err) => {console.error(err);})
}
module.exports = {
    saveGameData,
    saveLeaderBoards,
    makeLeaderString,
    updateLeaderBoards
}