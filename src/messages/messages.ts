import type { Message } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

export const messages = [
  {
    message: 'ping',
    response: () => 'pong',
  },
  {
    message: 'pong',
    response: () => 'ping',
  },
  {
    message: 'hey',
    response: () => {
      return {
        embeds: [
          new EmbedBuilder().setTitle('Hello!').setDescription('How are you?'),
        ],
      };
    },
  },
  {
    message: 'hello',
    response: (message: Message) => {
      return `Hello ${message.author.toString()}!`;
    },
  },
  {
    message: 'create collectible',
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
    message: 'app.playbite.com',
    // Return response with a clickable link
    response: () => {
      return `https://app.playbite.com`;
    },
  },
];
