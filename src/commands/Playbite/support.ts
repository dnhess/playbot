import type { CommandInteraction } from 'discord.js';
import { bold, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('support')
  .setDescription(
    'Help users out by running this command! It will direct them to the correct email for help. '
  );

export const execute = async (interaction: CommandInteraction) => {
  const email = bold('support@playbite.com');
  return interaction.reply(`Hello! Please email ${email} for support. For faster help please include the following information:
  - Your Playbite username
  - Country
  - Device
  - A detailed description of the issue
  `);
};
