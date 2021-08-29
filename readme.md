This Discord bot can be set up and installed by anyone, probably! I don't know, I've never done this before. The assumption is that this repository can be downloaded and run on any local machine, but you must first set up a Discord bot to obtain a unique bot token ID. I may change this later, but for now I'm just trying to get it up and running by Sunday's raid.

-Bids must be opened in the format of /gu Opening bids on itemName
  -One item per message
-Bids must be made in the format of /gu itemName [bidAmount or membershipStatus] [bidAmount or membershipStatus]
  -One item per message
-Bids must be closed in the format of /gu itemname > [anything] sold [anything]
  -One item per message

Create a .env file and place it in the dkp-bid-tracker folder. This should contain TOKEN=yourDiscordOAuthToken, LOGFILE=pathToLogFile, YOU=yourCharName, and TIMEZONE=yourTimeZone. These variables are used to help make the code more portable so anyone can run it.

Send a tell to Aradune.Moog or Erollisi.Noskemach and say hi. Long live <Qeynos Militia>.
