const { SlashCommandBuilder, SlashCommandSubcommandBuilder, ActionRowBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const {bankCost, bankearnings, bankPeriodmin} = require("../../finaFilen.json")
module.exports = {
    category: 'utility',
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Shows available commands and what they do'),
	async execute(interaction) {
        const message = `\`/blackjack\` bet:Number joinplayer:User - Allows you to play blackjack, bet: amount you want to bet, joinplayer(optional) allows you to join another players blackjack room` +
        `\n\`/jackpot\` spin:Bool Allows you to spin the jackpot wheel once every 20h spin(optional) if spin spins the wheel, else shows how much the jackpot is worth`+
        `\n\`/rob\` target:User amount:Number  Allows you to rob a User for "amount"(optional) of gold Note that a rob attempt costs 1/5 of amount in equipment`+
        `\n\`/roulette\` color:Choice amount:Number joinplayer:User Allows you to play roulette, puts a bet of amount on color, if you use joinplayer(optional) you can also join in on another players roulette spin`+
        `\n\`/rps\` target:User bet:Number weapon:Choice  Allows you to challenge target in Rock Paper Scissors, Note that the lowest bet between the two players is the bet that will be played`+
	    `\n\`/buybank\` amount:Number  Allows you to buy banks that generate ${bankearnings} gold every ${bankPeriodmin} minutes for ${bankCost} gold, amount(optional) how many banks you want to buy`+
	    `\n\`/give\` amount:Number target:User  Gives the target user amount of gold from you`+
	    `\n\`/pray\` amount:Number target:User  Gives you a chance to get amount(optional) of gold or to give amount of gold to another player, costs nothing. Note a pray of 100 gold as a success chance of 50%`+
	    `\n\`/info\`\n- \`game\` shows you info on your current ingame stats, for example how much gold you have\n- \`user\` target:User shows a users discord info in the server your in\n- \`server\` shows info about the server`+
	    `\n\`/spy\`  shows another users equivalent of /user game`+
	    `\n\`/pfp\` targetuser:User shows another users profilepick`
        await interaction.reply({content: message, ephemeral: true})
    },
};