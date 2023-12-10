// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

import { welcomeDMSchema } from '../../Schemas/welcomeDM';

export const data = new SlashCommandBuilder()
  .setName('disable-welcome-message-dm')
  .setDescription('Disables the welcome message in DMs')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const { guildId } = interaction;

  await interaction.deferReply({ ephemeral: true });

  // Delete the welcome message from the database
  await welcomeDMSchema.deleteOne({
    guildId,
  });

  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(
      ':white_check_mark: Successfully disabled the welcome message in DMs!'
    );

  return interaction.editReply({ embeds: [embed] });
};
