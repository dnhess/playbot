// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

import { welcomeSchema } from '../../Schemas/welcome';

export const data = new SlashCommandBuilder()
  .setName('enable-welcome')
  .setDescription('Enables welcome messages on the server')
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('The channel to send the welcome message in')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);
// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const channel = interaction.options.getChannel('channel');
  const perm = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(`:x: You do not have the permissions to use this command!`);

  if (!interaction.member.permissions.has('ADMINISTRATOR')) {
    return interaction.reply({ embeds: [perm] });
  }

  await interaction.deferReply({ ephemeral: true });

  const { guildId } = interaction;

  // Add the welcome message to the database
  await welcomeSchema.replaceOne(
    {
      guildId,
    },
    {
      guildId,
      channel: channel.id,
    },
    { upsert: true }
  );

  // Replay with a success message only if the welcome message was added to the database
  // This message is only visible to the user who ran the command
  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(
      `:white_check_mark: Successfully enabled welcome messages in ${channel} !`
    );

  return interaction.editReply({ embeds: [embed] });
};
