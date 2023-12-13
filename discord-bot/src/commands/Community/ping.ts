import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!');

export const execute = async (interaction: CommandInteraction) => {
  return interaction.reply('Pong, checking deploy pipeline status!');
};
