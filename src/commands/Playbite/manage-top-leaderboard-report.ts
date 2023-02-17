// Command to insert into cronJobs

// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

import { cronJobSchema } from '../../Schemas/cronJobs';

export const data = new SlashCommandBuilder()
  .setName('manage-top-leaderboard-report')
  .setDescription(
    'Enables the cron job to report the leaderboard scores every 24 hours'
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('enable')
      .setDescription('Enables the cron job')
      .addChannelOption((option) =>
        option
          .setName('channel')
          .setDescription('The channel to send the report to')
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName('disable').setDescription('Disables the cron job')
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const { guildId } = interaction;
  const subcommand = interaction.options.getSubcommand();
  const channel = interaction.options.getChannel('channel');
  console.log(subcommand);
  await interaction.deferReply({ ephemeral: true });

  let embed;

  if (subcommand === 'enable') {
    console.log('enable');
    // Enable the cron job
    await cronJobSchema.replaceOne(
      {
        guildId,
      },
      {
        guildId,
        channelId: channel.id,
        cronId: 'top',
      },
      {
        upsert: true,
      }
    );

    embed = new EmbedBuilder()
      .setColor('#7E47F3')
      .setDescription(
        ':white_check_mark: Successfully enabled the cron job to report the leaderboard scores every 24 hours!'
      );
  } else if (subcommand === 'disable') {
    // Disable the cron job
    await cronJobSchema.deleteOne({
      guildId,
      cronId: 'top',
    });

    embed = new EmbedBuilder()
      .setColor('#7E47F3')
      .setDescription(
        ':white_check_mark: Successfully disabled the cron job to report the leaderboard scores every 24 hours!'
      );
  } else {
    embed = new EmbedBuilder()
      .setColor('#7E47F3')
      .setDescription(
        ':x: Please specify whether you want to enable or disable the cron job'
      );
  }

  return interaction.editReply({ embeds: [embed] });
};
