import { EmbedBuilder } from 'discord.js';

export const messages = [
  {
    message: /create a collectible/i,
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
];
