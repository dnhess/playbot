import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play now in your browser! Returns a link to the game.');

export const execute = async (interaction: CommandInteraction) => {
  return interaction.reply('https://app.playbite.com/');
};
