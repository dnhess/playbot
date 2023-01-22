// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('disable-reactions')
  .setDescription(
    'Disables adding new reactions in a given channel. This not prevent adding to existing reactions'
  )
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('The channel you wish to disable reactions on')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels);
// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const channel = interaction.options.getChannel('channel');

  channel.permissionOverwrites.create(interaction.guild?.id, {
    AddReactions: false,
  });

  // Replay with a success message only if the welcome message was added to the database
  // This message is only visible to the user who ran the command
  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(
      `:white_check_mark: Successfully **disabled** reactions for ${channel}!`
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
};
