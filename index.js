// //regex: ([A-Z]{1}[a-z]+?) tells the guild\, \'(.+) (main|ralt|app|fnf|[0-9]+) (main|ralt|app|fnf|[0-9]+)
const fs = require('fs');
require('dotenv').config();
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
Tail = require('tail').Tail;
const fileToTail = process.env.LOGFILE;
tail = new Tail(fileToTail);
const openStr = '[Mon Aug 23 19:07:13 2021] Udayan tells the guild, \'Opening bids on Pulsing Emerald Hoop\''
var openItems = [];
const openRe = /([0-9]{2}\:[0-9]{2}\:[0-9]{2}) .* ([A-Z]{1}[a-z]+?) (?:tells the guild|say to your guild)\, \'[O|o]pening bids on ([A-zA-Z0-9\ \-\,]+)/;
//[1] is time
//[2] is person who opened bid
//[3] is item name
const bidRe = /([0-9]{2}\:[0-9]{2}\:[0-9]{2}) .* ([A-Z]{1}[a-z]+?) (?:tells the guild|say to your guild)\, \'(.+) (main|ralt|app|fnf|[0-9]+) (main|ralt|app|fnf|[0-9]+)/;
//[1] is time
//[2] is person who bid
//[3] is status or bid
//[4] is status or bid
const closeRe = /([0-9]{2}\:[0-9]{2}\:[0-9]{2}) .* ([A-Z]{1}[a-z]+?) (?:tells the guild|say to your guild)\, \'([A-zA-Z0-9\ \-\,]+) \>.*sold/;
//[1] is time
//[2] is person who closed
//[3] is item name

//in order to interact with findItemIndex() et al, array syntax after any RegEx is called
//should be [fullString, time, person(, amount/status, amount/status)]

////initUnwatch(); //this is dumb I think
// tail.on('line', function(data) {
//   console.log(data);
// });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
  if (message.content === 'start') {
    message.channel.send('Beginning monitor of log file…');
    //tail.watch();
    readLines(message);
  } else if (message.content === 'list') {
    listItems(message);
  }
  // else if (message.content === 'stop') {
  //   message.channel.send('Ending monitor of log file.')
  //   tail.unwatch();
  // }
});

function readLines(message) {
  tail.on('line', function(data) {
    //console.log(data);
    //message.channel.send(data);
    //[Sat Aug 28 00:28:42 2021] You say, 'jyfkufk'
    //(date)(name)('says to guild')(item name)(status)(bid)
    if (bidRe.test(data)) {
      // console.log('working');
      newBid(message, data);
    } else if (openRe.test(data)) {
      openItem(message, data);
    } else if (closeRe.test(data)) {
      closeItem(message, data);
    }
    // console.log(result[3]);
    //message.channel.send(`Current bid on ${openItem}: ${bidResult[1]} for ${bidResult[4]} (${bidResult[3]}) `);
    }
  );
}

function openItem(message, data){
  let openResult = openRe.exec(data);
  if (openResult[2] === 'You') {
    openResult[2] = process.env.YOU;
  }
  openItems.push([openResult[3],openResult[2],openResult[1],[]]);
  //console.log(openItems);
  message.channel.send(`Bids now open on ${openItems[openItems.length - 1][0]} (opened by ${openItems[openItems.length - 1][1]}).`)
}

function listItems(message) {
  var outString = 'Current items open for bidding:\n';
  //console.log(openItems);
  for (let i = 0; i < openItems.length; i++){
    outString += openItems[i][0] + ' — opened by ' + openItems[i][1] + ' at ' + openItems[i][2] + ' ' + process.env.TIMEZONE + '.\n';
  }
  message.channel.send(outString);
}

function closeItem(message, data){
  let closeResult = closeRe.exec(data);
  if (closeResult[2] === 'You') {
    closeResult[2] = process.env.YOU;
  }
  let targetItemIndex = findItemIndex(closeResult[3], data);
  //closeItems.push([openResult[3],openResult[2],openResult[1]]);
  message.channel.send(`Bids now closed on ${openItems[targetItemIndex][0]} (closed by ${openItems[targetItemIndex][1]}).`);
  openItems.splice(targetItemIndex, 1);
}

function findItemIndex(target, data) {
  for (let i = 0; i < openItems.length; i++) {
    if (openItems[i][0] === target) {
      return i;
    }
  }
  return undefined;
}

function newBid(message, data) {
  let bidResult = bidRe.exec(data);
  if (bidResult[2] === 'You') {
    bidResult[2] = process.env.YOU;
  }
  let targetItemIndex = findItemIndex(bidResult[3], data);
  //standardize order: bidder, bid amt, app status, time of bid
  if (Number(bidResult[3]) === NaN) {//if user put item, status, bid
    openItems[targetItemIndex][3].push([bidResult[2],bidResult[4],bidResult[3],bidResult[1]]);
  } else if (Number(bidResult[4]) === NaN) {//if user put item, bid, status
    openItems[targetItemIndex][3].push([bidResult[2],bidResult[3],bidResult[4],bidResult[1]]);
  }

}

// async function initUnwatch(){
//   await tail.unwatch();
// }

client.login(process.env.TOKEN);
