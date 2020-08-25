const Chance = require('chance');
require('dotenv').config();

const seed = Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER);

/* eslint-disable no-console */
console.log(`Seed is:${seed}`);
global.chance = Chance(seed);
