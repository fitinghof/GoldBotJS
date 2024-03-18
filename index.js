//https://discord.com/developers/applications/1205861805914857552/information

const { token } = require('./config.json');
const { bankCost, bankearnings, bankPeriodmin } = require('./finaFilen.json');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { saveUser, updateLeaderBoards, player }  = require('./funcs.js');

const client = new Client({ intents: [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildPresences,
] });

origlog = console.log;
console.log = (...args) => origlog.apply(null, [`[${(new Date(Date.now()).toLocaleString())}]`].concat(args) );

client.commands = new Collection();
client.cooldowns = new Collection();
client.gameData = new Collection();
client.leaderBoards = new Collection();
client.rouletteRooms = new Collection();
client.rpsRooms = new Collection();
client.blackJackTables = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

{
const filePath = './persistantData/userData.json';
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    try {
		parsedData = JSON.parse(data);
        for(const key in parsedData){
			client.gameData.set(key, new player(parsedData[key]));
		}
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
});
}
{
const filePath = './persistantData/leaderBoards.json';
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    try {
		parsedData = JSON.parse(data);
        for(const key in parsedData){
			client.leaderBoards.set(key, parsedData[key]);
		}
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
});
}

setInterval(() => {
	const currentTime = Date.now() + (1000*60*60);
	const minute = Math.floor((currentTime % (60 * 60 * 1000)) / (1000 * 60));
	const hour = Math.floor((currentTime %(24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
	if(minute % bankPeriodmin == 0){
		try {
			client.gameData.each((obj) => {
				obj.gold += obj.banks * bankearnings;
			})
			updateLeaderBoards(client);
		} catch(err) {console.error(err);}
	}
	if(minute%60 === 0) {
		console.log("--- Still living ---")
	}
}, 60000)

client.login(token);