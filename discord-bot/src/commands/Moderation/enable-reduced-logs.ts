// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

import { reducedLogsSchema } from '../../Schemas/reducedLogging';

export const data = new SlashCommandBuilder()
  .setName('enable-reduced-logs')
  .setDescription(
    'Turns on and off logging run this command again to turn it off'
  )
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('The channel to send the logs')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addBooleanOption((option) =>
    option.setName('enable').setDescription('Enable or disable logging')
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const channel = interaction.options.getChannel('channel');
  const enable = interaction.options.getBoolean('enable') ?? true;

  await interaction.deferReply({ ephemeral: true });

  const { guildId } = interaction;

  // If !enable then delete the guild from the database

  if (!enable) {
    await reducedLogsSchema.deleteOne({
      guildId,
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#7E47F3')
          .setDescription(
            `:white_check_mark: Successfully disabled logging in ${channel} !`
          ),
      ],
    });
  }

  // Add the welcome message to the database
  await reducedLogsSchema.replaceOne(
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
      `:white_check_mark: Successfully enabled logging. Logs will be sent to: ${channel} !`
    );

  return interaction.editReply({ embeds: [embed] });
};
