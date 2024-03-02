const fs = require('node:fs');

function saveGameData(gameData) {
    //Object.fromEntries(gameData)
    const data = JSON.stringify(Object.fromEntries(gameData));
    console.log(data);
    fs.writeFile(`C:/Users/fitin/Documents/Javascript/GoldBotJS/persistantData/userData.json`,data, (err) => {console.error(err);})
}
module.exports = {
    saveGameData
}