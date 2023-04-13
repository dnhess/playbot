import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('support')
  .setDescription(
    'Help users out by running this command! It will direct them to the correct email for help. '
  );

export const execute = async (interaction: CommandInteraction) => {
  return interaction.reply(`Hello! Please submit a request on http://support.playbite.com/ for help. To make sure we can help quickly, please include the following information:
  - Your email
  - Your Playbite username
  - Country
  - Device
  - A detailed description of the issue`);
};
