const { Collection } = require("discord.js");
const fs = require("fs")
const path = require('path');


class DataBase {
    #directoryPath;
    data = {};
    constructor(directoryPath) {
        this.#directoryPath = directoryPath;
}
    SyncData(dataName, converter = function (entry) { return entry }) {
        const filePath = path.join(this.#directoryPath, dataName + ".json");
        const dataString = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(dataString);
        const dataCollection = new Collection()
        for(const key in data){
            dataCollection.set(key, converter(data[key]))
        }
        this.data[dataName] = dataCollection;
        this.data[dataName].save = () => {
            const newData = JSON.stringify(Object.fromEntries(this.data[dataName]), null, 2);
                fs.writeFile(path.join(this.#directoryPath, dataName + ".json"), newData, (err) => {
                    if(err) console.error(err);
                })
            };
        this.data[dataName].noSaveSet = this.data[dataName].set
        this.data[dataName].set = (key, value) => {
            this.data[dataName].noSaveSet(key, value);
            this.data[dataName].save();
        }
    }
}

const dataBase = new DataBase(__dirname + "/persistantData");
dataBase.SyncData("otherData");
dataBase.data.otherData.set("jackPot", 100);
console.log(dataBase.data.otherData);
//console.log(JSON.stringify(dataBase, null, 2));