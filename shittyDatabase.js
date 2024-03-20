const fs = require("fs")

class DataBase {
    #filePath;
    #data;
    constructor(filePath) {
        dataPath = fs.readdirSync(path.join(__dirname, 'persistantData'))
        for (const file of dataPath) {
            const filePath = path.join(dataPath, file);
            fs.readFile(filePath, (err, content) => {
                if (err) {
                    console.error('Error reading file:', err);
                    return;
                }
                const dataName = file.replace((symbol) => {symbol === ".json"}, "")
                const data = JSON.parse(content);
                client.data[dataName] = data;
                client.data[dataName].save = () => {};
            })
        } 
        const dataString = fs.readFileSync(filePath, 'utf8');
        this.data = JSON.parse(dataString);
    }
}
module.exports = {

}