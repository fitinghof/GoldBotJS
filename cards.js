const { Collection } = require('discord.js');

const cardFlags = new Collection([
    ["spadeAce", 0],
    ["spade2", 1],
    ["spade3", 2],
    ["spade4", 3],
    ["spade5", 4],
    ["spade6", 5],
    ["spade7", 6],
    ["spade8", 7],
    ["spade9", 8],
    ["spade10", 9],
    ["spadeJack", 10], 
    ["spadeQueen", 11],
    ["spadeKing", 12], 
    ["heartAce", 13],
    ["heart2", 14],
    ["heart3", 15],
    ["heart4", 16],
    ["heart5", 17],
    ["heart6", 18],
    ["heart7", 19],
    ["heart8", 20],
    ["heart9", 21],
    ["heart10", 22],
    ["heartJack", 23], 
    ["heartQueen", 24],
    ["heartKing", 25], 
    ["clubAce", 26],
    ["club2", 27],
    ["club3", 28],
    ["club4", 29],
    ["club5", 30],
    ["club6", 31],
    ["club7", 32],
    ["club8", 33],
    ["club9", 34],
    ["club10", 35],
    ["clubJack", 36],
    ["clubQueen", 37], 
    ["clubKing", 38],
    ["diamondAce", 39],
    ["diamond2", 40],
    ["diamond3", 41],
    ["diamond4", 42],
    ["diamond5", 43],
    ["diamond6", 44],
    ["diamond7", 45],
    ["diamond8", 46],
    ["diamond9", 47],
    ["diamond10", 48], 
    ["diamondJack", 49],
    ["diamondQueen", 50],
    ["diamondKing", 51],
])

const cardsFormated = [  
    "[Ace of :spades:]",
    "[2 of :spades:]",
    "[3 of :spades:]",
    "[4 of :spades:]",
    "[5 of :spades:]",
    "[6 of :spades:]",
    "[7 of :spades:]",
    "[8 of :spades:]",
    "[9 of :spades:]",
    "[10 of :spades:]",
    "[Jack of :spades:]",
    "[Queen of :spades:]",
    "[King of :spades:]",
    "[Ace of :hearts:]",
    "[2 of :hearts:]",
    "[3 of :hearts:]",
    "[4 of :hearts:]",
    "[5 of :hearts:]",
    "[6 of :hearts:]",
    "[7 of :hearts:]",
    "[8 of :hearts:]",
    "[9 of :hearts:]",
    "[10 of :hearts:]",
    "[Jack of :hearts:]",
    "[Queen of :hearts:]",
    "[King of :hearts:]",
    "[Ace of :clubs:]",
    "[2 of :clubs:]",
    "[3 of :clubs:]",
    "[4 of :clubs:]",
    "[5 of :clubs:]",
    "[6 of :clubs:]",
    "[7 of :clubs:]",
    "[8 of :clubs:]",
    "[9 of :clubs:]",
    "[10 of :clubs:]",
    "[Jack of :clubs:]",
    "[Queen of :clubs:]",
    "[King of :clubs:]",
    "[Ace of :diamonds:]",
    "[2 of :diamonds:]",
    "[3 of :diamonds:]",
    "[4 of :diamonds:]",
    "[5 of :diamonds:]",
    "[6 of :diamonds:]",
    "[7 of :diamonds:]",
    "[8 of :diamonds:]",
    "[9 of :diamonds:]",
    "[10 of :diamonds:]",
    "[Jack of :diamonds:]",
    "[Queen of :diamonds:]",
    "[King of :diamonds:]"
];
class hand {
    cards = [];
    toString() {
        return this.cards.reduce((accumulator, currentvalue) => accumulator += (cardsFormated[currentvalue] + " "), "" )
    }
}

class cardGame {
    deck = [];
    dealerHand = [];
    players = [];
    usedCards = [];
    minCardsInDeck = 1;

    constructor(nrOfDecks, minCardsInDeck){
        for(let i = 0; i < nrOfDecks; i++) cardFlags.each(element => this.deck.push(element));
        this.minCardsInDeck = minCardsInDeck;
    }
    drawCards(hand, nrOfCards){
        for(let i = 0; i < nrOfCards; i++){
            let dealtCard = Math.floor(Math.random() * this.deck.length);
            hand.push(this.deck[dealtCard]);
            this.deck.splice(dealtCard, 1);
            if(this.deck.length < this.minCardsInDeck ){
                this.deck = this.deck.concat(this.usedCards);
            }
        }
        return hand;
    } 
    clearAllCards(forEachPlayer = (player, index) => {}){
        this.usedCards = this.usedCards.concat(this.dealerHand);
        this.dealerHand.splice(0, this.dealerHand.length);
        this.players.forEach(( player, index )=> {
            this.usedCards = this.usedCards.concat(player.hand)
            player.hand.splice(0, player.hand.length);
            forEachPlayer(player, index);
        })
    }
    throwCard(hand, cardIndex){
        this.usedCards.push(hand[cardIndex])
        hand.splice(cardIndex, 1);
    }
}

module.exports = {
    hand,
    cardGame,
    cardsFormated,
    cardFlags
}