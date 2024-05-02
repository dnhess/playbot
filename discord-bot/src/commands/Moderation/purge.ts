// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

import { guildLogsSchema } from '../../Schemas/enableLogging';

export const data = new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Bulk remove messages from a specific member')
  .addUserOption((option) =>
    option
      .setName('target')
      .setDescription('The member to remove messages from.')
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('amount')
      .setDescription('The number of messages to remove.')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages);
// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const target = interaction.options.getUser('target');
  const amount = interaction.options.getInteger('amount');
  const targetMember = interaction.guild.members.cache.get(target.id);

  if (amount <= 0 || amount > 100) {
    return interaction.reply({
      content: 'Please provide a valid amount between 1 and 100.',
      ephemeral: true,
    });
  }

  // Report the command execution to the guilds channel, found with guildSchema guild.id
  const guild = await interaction.client.guilds.fetch(interaction.guildId);

  guildLogsSchema.findOne({ guildId: guild.id }, async (err, requestData) => {
    if (err) throw err;
    if (requestData) {
      const loggingChannel = guild.channels.cache.get(requestData.channel);
      if (loggingChannel) {
        if (
          targetMember.roles.highest.rawPosition >=
          interaction.member.roles.highest.rawPosition
        ) {
          loggingChannel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Red')
                .setDescription(
                  `**${interaction.user.username}** (<@${interaction.user.id}>) tried to delete messages from **${target?.username} (<@${target.id}>)** but was denied.`
                ),
            ],
          });

          return;
        }

        loggingChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setDescription(
                `**${interaction.user.username}** (<@${interaction.user.id}>) has deleted **${amount}** messages from **${target?.username} (<@${target.id}>)**.`
              ),
          ],
        });
      }
    }
  });

  if (
    targetMember.roles.highest.rawPosition >=
    interaction.member.roles.highest.rawPosition
  ) {
    return interaction.reply({
      content:
        'You cannot purge messages from someone with an equal or higher role.',
      ephemeral: true,
    });
  }

  const { channel } = interaction;
  const messages = await channel.messages.fetch({ limit: 100 });
  const filteredMessages = messages
    .filter((msg) => msg.author.id === target.id)
    .first(amount);

  if (filteredMessages.size === 0) {
    return interaction.reply({
      content: 'No messages found from the specified member.',
      ephemeral: true,
    });
  }

  await channel.bulkDelete(filteredMessages, true);

  return interaction.reply({
    content: `Successfully removed ${filteredMessages.length} messages from ${target.tag}.`,
    ephemeral: true,
  });
};
