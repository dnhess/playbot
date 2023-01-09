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
];
