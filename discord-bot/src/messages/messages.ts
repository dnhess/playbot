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
];
