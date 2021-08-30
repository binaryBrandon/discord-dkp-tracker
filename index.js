// //regex: ([A-Z]{1}[a-z]+?) tells the guild\, \'(.+) (main|ralt|app|fnf|[0-9]+) (main|ralt|app|fnf|[0-9]+)
const fs = require('fs');
require('dotenv').config();
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
Tail = require('tail').Tail;
const fileToTail = process.env.LOGFILE;
tail = new Tail(fileToTail);
let openItems = [];
const openRe = /([0-9]{2}\:[0-9]{2}\:[0-9]{2}) .* ([A-Z]{1}[a-z]+?) (?:tells the guild|say to your guild)\, \'[O|o]pening bids on ([A-zA-Z0-9\ \-\,]+)/;
//[1] is time
//[2] is person who opened bid
//[3] is item name
const bidRe = /([0-9]{2}\:[0-9]{2}\:[0-9]{2}) .* ([A-Z]{1}[a-z]+?) (?:tells the guild|say to your guild)\, \'(.+) (main|ralt|app|fnf|alt|[0-9]+(?:x2| x2| x 2)*) (main|ralt|app|fnf|alt|[0-9]+(?:x2| x2| x 2)*)/i;
//[1] is time
//[2] is person who bid
//[3] is item name
//[4] is status or bid
//[5] is status or bid
const closeRe = /([0-9]{2}\:[0-9]{2}\:[0-9]{2}) .* ([A-Z]{1}[a-z]+?) (?:tells the guild|say to your guild)\, \'([A-zA-Z0-9\ \-\,]+) \>.*gratss/;
//[1] is time
//[2] is person who closed
//[3] is item name
const testRe = /(?:tells the guild|say to your guild)/;

//in order to interact with findItemIndex() et al, array syntax after any RegEx is called
//should be [fullString, time, person(, amount/status, amount/status)]

////initUnwatch(); //this is dumb I think
// tail.on('line', function(data) {
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
    //message.channel.send(data);
    //[Sat Aug 28 00:28:42 2021] You say, 'jyfkufk'
    //(date)(name)('says to guild')(item name)(status)(bid)
    if (testRe.test(data)) {
      console.log(data);
      if (bidRe.test(data)) {
        console.log(`going to newBid`)
        newBid(message, data);
      } else if (openRe.test(data)) {
        console.log(`going to openItem`)
        openItem(message, data);
      } else if (closeRe.test(data)) {
        console.log(`going to closeItem`)
        closeItem(message, data);
      }
    }
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
  message.channel.send(`Bids now open on ${newItem.itemName} (opened by ${newItem.opener}).`)
}

const listItems = (message) => {
  message.channel.send('Current items open for bidding:');
  // for (let i = 0; i < openItems.length; i++){
  //   outString += openItems[i][0] + ' — opened by ' + openItems[i][1] + ' at ' + openItems[i][2] + ' ' + process.env.TIMEZONE + '.\n';
  // }

  openItems.forEach(item => {
    let outString = ''
    // if (item.)
    // `Current bids on ${item.itemName} — opened by ${item.opener} at ${item.timeOpened} ${process.env.TIMEZONE}.\n`;
    outString += displayBids(item);
    if (!outString) {
      message.channel.send(`${item.itemName} — opened by ${item.opener} at ${item.timeOpened} ${process.env.TIMEZONE}.\nNo bids on this item yet.`)
    } else if (outString) {
      message.channel.send(`${item.itemName} — opened by ${item.opener} at ${item.timeOpened} ${process.env.TIMEZONE}.\n${outString}`);
    }
  });
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
  console.log(`targetItemIndex is ${targetItemIndex}`);
  if (targetItemIndex !== -1){
    //closeItems.push([openResult[3],openResult[2],openResult[1]]);
    foundItem = openItems[targetItemIndex];
    let outString = `Bids now closed on ${foundItem.itemName} (closed by ${closeResult[2]}).\n`
    outString += (foundItem.currentBids[0] !== undefined ? displayBids(foundItem) : `Grats rot.`);
    openItems.splice(targetItemIndex, 1);
    message.channel.send(outString);
  } else {
    message.channel.send(`${closeResult[2]} tried to close bids on ${closeResult[3]}, but that item is not open (or there is a typo).`);
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
    return item.itemName.toLowerCase() === bidResult[3].toLowerCase();
  });
  let temp;
  //standardize order: matched string, time, bidder, item, app status, bid amt
  console.log(bidResult);
  console.log(targetItemIndex);
  if (isNaN(bidResult[5])) {//if user put item, bid, status
    temp = bidResult[4];
    bidResult[4] = bidResult[5];
    bidResult[5] = temp;
  }
  //check if this person has bid on this item before
  // for (let i = 0; i < openItems[targetItemIndex][3].length; i++) {
  //   if (openItems[targetItemIndex][3][i] === bidResult[2]){
  //     openItems[targetItemIndex][3][i] = [bidResult[2],bidResult[4],bidResult[3],bidResult[1]];
  //   }
  // }
  if (targetItemIndex === -1){
    message.channel.send(`${bidResult[2]} tried to bid on ${bidResult[3]}, but that item is not open (or there is a typo).`);
  } else {
    let foundItem = openItems[targetItemIndex]
    let bidderIndex = foundItem.currentBids.findIndex(bid => bid.bidderName === bidResult[2]);
    console.log(`bidderIndex is ${bidderIndex}`);
    if (bidderIndex === -1) {
      //add new bid object
      foundItem.currentBids.push(
        {
          bidderName: bidResult[2],
          bidAmount: Number(bidResult[5]),
          bidderStatus: bidResult[4],
          bidTime: bidResult[1]
        });
    } else {
      //else update their bid
      let bidder = foundItem.currentBids[bidderIndex];
      bidder.bidAmount = bidResult[3];
      bidder.bidAmount = Number(bidResult[5]);
    }
  }
}

const checkYourself = (result) => {
  if (result === 'You') {
    return process.env.YOU;
  } else return result;
}

const displayBids = (foundItem) => {
  let bidsRef = foundItem.currentBids;
  let stringToPrint = '';
  bidsRef.sort((curr, next) => (curr.bidAmount >= next.bidAmount ? -1 : 1));
  bidsRef.forEach(bid => (stringToPrint += `${bid.bidderName} (${bid.bidderStatus}) — ${bid.bidAmount} DKP at ${bid.bidTime} ${process.env.TIMEZONE}.\n`))
  //stringToPrint += `Top bid: ${bidsRef[0].bidderName} (${bidsRef[0].bidderStatus}) — ${bidsRef[0].bidAmount} DKP at ${bidsRef[0].bidTime} ${process.env.TIMEZONE}.`
  return stringToPrint;
}

// async function initUnwatch(){
//   await tail.unwatch();
// }

client.login(process.env.TOKEN);
