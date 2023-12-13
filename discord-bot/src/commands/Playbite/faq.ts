import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('faq')
  .setDescription('Get answers to common questions!');

export const execute = async (interaction: CommandInteraction) => {
  return interaction.reply(
    `Hello! It seems like you might have a question. Here's a very detailed "Frequently Asked Questions" page that will likely have the answer you're looking for! https://s.playbite.com/faq`
  );
};
