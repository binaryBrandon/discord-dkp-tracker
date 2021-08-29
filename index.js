// //regex: ([A-Z]{1}[a-z]+?) tells the guild\, \'(.+) (main|ralt|app|fnf|[0-9]+) (main|ralt|app|fnf|[0-9]+)
const fs = require('fs');
require('dotenv').config();
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
Tail = require('tail').Tail;
const fileToTail = process.env.LOGFILE;
tail = new Tail(fileToTail);
const openStr = '[Mon Aug 23 19:07:13 2021] Udayan tells the guild, \'Opening bids on Pulsing Emerald Hoop\''
let openItems = [];
const openRe = /([0-9]{2}\:[0-9]{2}\:[0-9]{2}) .* ([A-Z]{1}[a-z]+?) (?:tells the guild|say to your guild)\, \'[O|o]pening bids on ([A-zA-Z0-9\ \-\,]+)/;
//[1] is time
//[2] is person who opened bid
//[3] is item name
const bidRe = /([0-9]{2}\:[0-9]{2}\:[0-9]{2}) .* ([A-Z]{1}[a-z]+?) (?:tells the guild|say to your guild)\, \'(.+) (main|ralt|app|fnf|[0-9]+) (main|ralt|app|fnf|[0-9]+)/;
//[1] is time
//[2] is person who bid
//[3] is item name
//[4] is status or bid
//[5] is status or bid
const closeRe = /([0-9]{2}\:[0-9]{2}\:[0-9]{2}) .* ([A-Z]{1}[a-z]+?) (?:tells the guild|say to your guild)\, \'([A-zA-Z0-9\ \-\,]+) \>.*sold/;
//[1] is time
//[2] is person who closed
//[3] is item name
const testRe = /[0-9]{2}\:[0-9]{2}\:[0-9]{2} .* [A-Z]{1}[a-z]+? (?:tells the guild|say to your guild)/;

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
  else if (message.content === 'stop') {
    message.channel.send('Ending monitor of log file.')
    tail.unwatch();
  }
});

const readLines = (message) => {
  tail.on('line', function(data) {
    //console.log(data);
    //message.channel.send(data);
    //[Sat Aug 28 00:28:42 2021] You say, 'jyfkufk'
    //(date)(name)('says to guild')(item name)(status)(bid)
    if (testRe.test(data)) {
      if (bidRe.test(data)) {
        // console.log('working');
        newBid(message, data);
      } else if (openRe.test(data)) {
        openItem(message, data);
      } else if (closeRe.test(data)) {
        closeItem(message, data);
      }
    }
    // console.log(result[3]);
    //message.channel.send(`Current bid on ${openItem}: ${bidResult[1]} for ${bidResult[4]} (${bidResult[3]}) `);
  });
}


const openItem = (message, data) => {
  let openResult = openRe.exec(data);
  openResult[2] = checkYourself(openResult[2]);
  // if (openResult[2] === 'You') {
  //   openResult[2] = process.env.YOU;
  // }
  let newItem = {
    itemName: openResult[3],
    opener: openResult[2],
    timeOpened: openResult[1],
    currentBids: []
  }
  openItems.push(newItem);
  //console.log(openItems);
  message.channel.send(`Bids now open on ${newItem.itemName} (opened by ${newItem.opener}).`)
}

const listItems = (message) => {
  let outString = 'Current items open for bidding:\n';
  //console.log(openItems);
  // for (let i = 0; i < openItems.length; i++){
  //   outString += openItems[i][0] + ' — opened by ' + openItems[i][1] + ' at ' + openItems[i][2] + ' ' + process.env.TIMEZONE + '.\n';
  // }

  openItems.forEach(item => {
    outString += `${item.itemName} — opened by ${item.opener} at ${item.timeOpened} ${process.env.TIMEZONE}.\n`;
  });
  message.channel.send(outString);
}

const closeItem = (message, data) => {
  let closeResult = closeRe.exec(data);
  closeResult[2] = checkYourself(closeResult[2]);
  // if (closeResult[2] === 'You') {
  //   closeResult[2] = process.env.YOU;
  // }
  let targetItemIndex = openItems.findIndex(item => {
    return item.itemName === closeResult[3];
  });
  if (targetItemIndex){
    // console.log(targetItemIndex);
    //closeItems.push([openResult[3],openResult[2],openResult[1]]);
    message.channel.send(`Bids now closed on ${openItems[targetItemIndex].itemName} (closed by ${closeResult[2]}).`);
    openItems.splice(targetItemIndex, 1);
  } else {
    message.channel.send(`${closeResult[2]} tried to close bids on ${closeResult[3]}, but that item was not open (or there was a typo).`);
  }
}

//not needed since switching to object instead of array of arrays of arrays of arrays of arrays of arrays of...etc.
//also delete Ames IRL
// function findItemIndex(target, data) {
//   for (let i = 0; i < openItems.length; i++) {
//     if (openItems[i][0] === target) {
//       return i;
//     }
//   }
//   return undefined;
// }

const newBid = (message, data) => {
  let bidResult = bidRe.exec(data);
  bidResult[2] = checkYourself(bidResult[2]);
  // if (bidResult[2] === 'You') {
  //   bidResult[2] = process.env.YOU;
  // }
  let targetItemIndex = openItems.findIndex(item => {
    return item.itemName === bidResult[3];
  });
  let temp;
  //standardize order: bidder, bid amt, app status, time of bid
  if (Number(bidResult[4]) === NaN) {//if user put item, bid, status
    temp = bidResult[3];
    bidResult[3] = bidResult[4];
    bidResult[4] = temp;
  }
  //check if this person has bid on this item before
  // for (let i = 0; i < openItems[targetItemIndex][3].length; i++) {
  //   if (openItems[targetItemIndex][3][i] === bidResult[2]){
  //     openItems[targetItemIndex][3][i] = [bidResult[2],bidResult[4],bidResult[3],bidResult[1]];
  //   }
  // }
  let foundItem = openItems[targetItemIndex]
  let bidderIndex = foundItem.currentBids.findIndex(bid => bid.name === bidResult[2]);
  if (bidderIndex) {
    //add new bid object
    foundItem.currentBids.push(
      {
        bidderName: bidResult[2],
        bidAmount: bidResult[3],
        bidderStatus: bidResult[4],
        bidTime: bidResult[5]
      });
  } else {
    //else update their bid
    let bidder = foundItem.currentBids[bidderIndex];
    bidder.bidAmount = bidResult[3];
    bidder.bidAmount = bidResult[5];
  }
}

const checkYourself = (result) => {
  if (result === 'You') {
    return process.env.YOU;
  } else return result;
}

// async function initUnwatch(){
//   await tail.unwatch();
// }

client.login(process.env.TOKEN);
