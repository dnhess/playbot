// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('unlock')
  .setDescription('This unlocks a given channel')
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('The channel you want to unlock')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels);
// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const channel = interaction.options.getChannel('channel');

  channel.permissionOverwrites.create(interaction.guild?.id, {
    SendMessages: true,
  });

  // Replay with a success message only if the welcome message was added to the database
  // This message is only visible to the user who ran the command
  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(`:white_check_mark: Successfully **unlocked** ${channel}!`);

  await interaction.reply({ embeds: [embed], ephemeral: true });
};
