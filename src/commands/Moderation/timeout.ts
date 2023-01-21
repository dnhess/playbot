// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';
import ms from 'ms';

export const data = new SlashCommandBuilder()
  .setName('timeout')
  .setDescription('This times out a given user')
  .addUserOption((option) =>
    option
      .setName('user')
      .setDescription('The user you want to time out')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('duration')
      .setDescription('The time you want to time out the user for (1m, 1h, 1d)')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('reason')
      .setDescription('The reason for the time out')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.MuteMembers);
// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const { options, member } = interaction;
  const target = options.getMember('user');
  const duration = options.getString('duration');
  const reason = options.getString('reason');

  const errorEmbed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setAuthor({ name: 'Could not time out user due to' });

  if (!target) {
    errorEmbed.setDescription('Invalid user');
    return interaction.reply({ embeds: [errorEmbed] });
  }

  // Check if duration is > 28 days using luxon
  if (!ms(duration) || ms(duration) > ms('28d')) {
    errorEmbed.setDescription('Duration is too long (max 28 days)');
    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  if (!target.manageable) {
    errorEmbed.setDescription('I cannot manage that user');
    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  if (target.roles.highest.position >= member.roles.highest.position) {
    errorEmbed.setDescription('Selected user has a higher role than you');
    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  target.timeout(ms(duration), reason).catch((err) => {
    errorEmbed.setDescription(err);
    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  });

  const successEmbed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(
      `:white_check_mark: Successfully **timed out** ${target} for ${duration}!`
    );

  await interaction.reply({ embeds: [successEmbed], ephemeral: true });
};
