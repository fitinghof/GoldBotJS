const { Collection } = require("discord.js");
const fs = require("fs")
const path = require('path');
const { player } = require("./funcs.js")

class DataBase {
    #directoryPath;
    constructor(directoryPath) {
        this.#directoryPath = directoryPath;
}
    /**
        Makes DataBase file if none exists or loads an existing one if one does exist.
        @param dataName the name of the data category, should be the same as the file the data is in if one such file exists but without ".json".
        @param converter converts the value content of the file to a choosen type, for example an object could be converted to a predefined class.
        @param keyValueCollectionType should be a new iterable Object with set and get functions defined.
    **/
    SyncData(dataName, converter = function (entry) { return entry }, keyValueCollectionType = new Collection()) {
        const filePath = path.join(this.#directoryPath, dataName + ".json");
        let dataString = ""
        try {
            dataString = fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            dataString = JSON.stringify(keyValueCollectionType)
            fs.writeFileSync(filePath, dataString)
        }
        const data = JSON.parse(dataString);
        const dataCollection = keyValueCollectionType
        for(const key in data){
            dataCollection.set(key, converter(data[key]))
        }
        this[dataName] = dataCollection;
        this[dataName].save = () => {
            const newData = JSON.stringify(Object.fromEntries(this[dataName]), null, 2);
                fs.writeFile(path.join(this.#directoryPath, dataName + ".json"), newData, (err) => {
                    if(err) console.error(err);
                })
            };
        this[dataName].noSaveSet = this[dataName].set
        this[dataName].set = (key, value) => {
            this[dataName].noSaveSet(key, value);
            this[dataName].save();
        }
    }
}
class PersistantDataFile {
    #directoryPath;
    collection;
    constructor(directoryPath, dataName, converter = function (entry) { return entry }, keyValueCollectionType = Collection) {
        this.#directoryPath = directoryPath;
        this.collection = new keyValueCollectionType();
        let proto = Object.getPrototypeOf(this.collection);
        while (proto !== Object.prototype) {
          Object.getOwnPropertyNames(proto)
            .filter(method => typeof this.collection[method] === 'function')
            .forEach(method => {
              this[method] = this.collection[method].bind(this.collection);
            });
          proto = Object.getPrototypeOf(proto);
        }
        const filePath = path.join(this.#directoryPath, dataName + ".json");
        let dataString = ""
        try {
            dataString = fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            dataString = JSON.stringify(Object.fromEntries(this.collection))
            fs.writeFileSync(filePath, dataString)
        }
        let data;
        try {
            data = JSON.parse(dataString);
        } catch (error) {
            dataString = JSON.stringify(Object.fromEntries(this.collection))
            fs.writeFileSync(filePath, dataString)
        }
        for(const key in data){
            this.set(key, converter(data[key]))
        }
        this.save = () => {
            const newData = JSON.stringify(Object.fromEntries(this.collection), null, 2);
                fs.writeFile(path.join(this.#directoryPath, dataName + ".json"), newData, (err) => {
                    if(err) console.error(err);
                })
            };
        this.noSaveSet = this.set
        this.set = (key, value) => {
            this.noSaveSet(key, value);
            this.save();
        }
    }

}
module.exports = {
    PersistantDataFile,
    DataBase
}