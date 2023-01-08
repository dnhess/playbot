import { EmbedBuilder } from 'discord.js';

export const messages = [
  {
    message: 'ping',
    response: 'pong',
  },
  {
    message: 'pong',
    response: 'ping',
  },
  {
    message: 'hello',
    response: {
      embeds: [
        new EmbedBuilder().setTitle('Hello!').setDescription('How are you?'),
      ],
    },
  },
];
