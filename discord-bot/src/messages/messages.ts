import { EmbedBuilder } from 'discord.js';

export const messages = [
  {
    // eslint-disable-next-line
    message:
      /(create|make|build|construct|design)\s+(a\s+)?(playbite\s+)?collectible/i,
    response: () => {
      return {
        embeds: [
          new EmbedBuilder()
            .setTitle('Hey, you can create your own collectible!')
            .setColor('#7E47F3')
            .setDescription(
              `To create a new collectible, go to [Create your Own Collectible on Playbite](https://www.playbite.com/creating-your-own-collectible-on-playbite/).`
            ),
        ],
      };
    },
  },
  {
    message: /(?<!https:\/\/)app\.playbite\.com/,
    // Return response with a clickable link
    response: () => {
      return `https://app.playbite.com`;
    },
  },
  {
    message: /visa\s+(gift\s+)?cards/i,
    response: () => {
      return `hey! 👋 we actually don't want to do that, we want it to always be about prizes, products, and brands you love 🙂 not "money" 😅`;
    },
  },
  {
    message: /(?=.*\bbest\b)(?=.*\bgame\b)(?=.*\btickets?\b).+/gi,
    response: () => {
      return `What ever game you are the best at!`;
    },
  },
  {
    message: /what are the odds .+/i,
    response: () => {
      return 'Nobody knows the odds and nobody will tell you what they are';
    },
  },
  {
    message: /what are the chances .+/i,
    response: () => {
      return 'Nobody knows the odds and nobody will tell you what they are';
    },
  },
  {
    message: /(lost|losing|decrease|reduced)\s+(\d+)?\s*tickets?/i,
    response: () => {
      return 'Checkout <#1084878200980643890> for information specifically about ticket loss.';
    },
  },
  {
    message: /went\s+from\s+\d+\s+to\s+\d+\s*tickets?/i,
    response: () => {
      return 'Checkout <#1084878200980643890> for information specifically about ticket loss.';
    },
  },
  {
    message: /why\s+am\s+I\s+getting\s+only\s+\d+\s+tickets?\s+every\s+game/i,
    response: () => {
      return 'Checkout <#1084878200980643890> for information specifically about ticket loss.';
    },
  },
  {
    message: /why\s+did\s+I\s+go\s+from\s+\d+k?\s+to\s+\d+\s+tickets?/i,
    response: () => {
      return 'Checkout <#1084878200980643890> for information specifically about ticket loss.';
    },
  },
  {
    message: /why\s+am\s+I\s+only\s+(getting|earning)\s+\d+\s+tickets?/i,
    response: () => {
      return 'Checkout <#1084878200980643890> for information specifically about ticket loss.';
    },
  },
  {
    message:
      /why\s+(did|do)\s+my\s+(ticket\s+earnings|tickets)\s+(drop|decrease|reduce|go\s+down)\?/i,
    response: () => {
      return 'Checkout <#1084878200980643890> for information specifically about ticket loss.';
    },
  },
  {
    // Handles straightforward queries like "what is available in Bulgaria" or "what prizes are available in Sweden"
    message:
      /what('s| is)?\s(available\s(in|for)\s\w+\??|prizes?\sare\savailable\s(in|for)\s\w+)/i,
    response: () => {
      return {
        embeds: [
          new EmbedBuilder()
            .setTitle('Prizes Availability')
            .setColor('#7E47F3')
            .setDescription(
              `If you do not live in the US, Canada, or the UK the prizes currently available to you are:

              Roblox, Minecoins, Steam, Nitro, Valorant, Taco Bell, McDonalds, Temu, Shein, Lululemon, Krispy Kreme, Dunkin Donuts, Chick-fil-a, Netflix, Twitch, NBA/NFL/NHL stores, Cinnabon, Five Guys, Panda Express, Jamba Juice, Papa Johns, Ihop, Chipotle, Uber Eats, Dominos, Doordash, H&M, TJ Maxx, Walmart 
              
              *Currently, all prizes in India are out of stock.`
            ),
        ],
      };
    },
  },
  {
    // Handles more complex or conversational queries like "sorry to bother but is the fortnite vbucks giftcard available in North Macedonia"
    message:
      /(?:sorry\s+to\s+bother\s+but\s+)?is\s+.+\s+(prize|prizes?|gift\s?cards?|cards?)\s+available\s(in|for)\s\w+|\w+\s+(prize|prizes?|gift\s?cards?|cards?)\s+available\s(in|for)\s\w+\??/i,
    response: () => {
      return {
        embeds: [
          new EmbedBuilder()
            .setTitle('Prizes Availability')
            .setColor('#7E47F3')
            .setDescription(
              `If you do not live in the US, Canada, or the UK the prizes currently available to you are:

              Roblox, Minecoins, Steam, Nitro, Valorant, Taco Bell, McDonalds, Temu, Shein, Lululemon, Krispy Kreme, Dunkin Donuts, Chick-fil-a, Netflix, Twitch, NBA/NFL/NHL stores, Cinnabon, Five Guys, Panda Express, Jamba Juice, Papa Johns, Ihop, Chipotle, Uber Eats, Dominos, Doordash, H&M, TJ Maxx, Walmart 
              
              *Currently, all prizes in India are out of stock.`
            ),
        ],
      };
    },
  },
];
