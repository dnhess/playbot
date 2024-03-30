// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('This locks a given channel')
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('The channel you want to lock')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);
// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const channel = interaction.options.getChannel('channel');

  channel.permissionOverwrites.create(interaction.guild?.id, {
    SendMessages: false,
  });

  // Replay with a success message only if the welcome message was added to the database
  // This message is only visible to the user who ran the command
  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(`:white_check_mark: Successfully **locked** ${channel}!`);

  await interaction.reply({ embeds: [embed], ephemeral: true });
};
