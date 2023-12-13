// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

import { welcomeSchema } from '../../Schemas/welcome';

export const data = new SlashCommandBuilder()
  .setName('disable-welcome')
  .setDescription('Disables the bot welcome message')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const { guildId } = interaction;

  await interaction.deferReply({ ephemeral: true });

  // Delete the welcome message from the database
  await welcomeSchema.deleteOne({
    guildId,
  });

  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(
      ':white_check_mark: Successfully disabled welcome messages'
    );

  return interaction.editReply({ embeds: [embed] });
};
