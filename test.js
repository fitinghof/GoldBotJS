const fullChanceTime = 24;
const startChance = 0.5;
const timeSinceLastRob = Math.min((Date.now() - 0)/(1000*60*60), fullChanceTime);
const timeChanceMultiplier = startChance + ((timeSinceLastRob * (1 - startChance)) / fullChanceTime)
const chance = 0.8 * timeChanceMultiplier/(1+30*Math.pow(3000 / 6846, 3) * 0.5) 
console.log(chance) 