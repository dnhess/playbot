/* eslint-disable no-await-in-loop */
// @ts-nocheck
import type {
  CommandInteraction,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

import { guildLogsSchema } from '../../Schemas/enableLogging';

export const data = new SlashCommandBuilder()
  .setName('purge-all')
  .setDescription(
    'Deletes all messages from a specified user in all channels, threads, and forums'
  )
  .addUserOption((option) =>
    option
      .setName('target')
      .setDescription('The user whose messages will be deleted')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages);

export const execute = async (interaction: CommandInteraction) => {
  const targetUser = interaction.options.getUser('target');

  if (!targetUser) {
    return interaction.reply({
      content: 'You must specify a user.',
      ephemeral: true,
    });
  }

  const guild = await interaction.client.guilds.fetch(interaction.guildId);
  if (!guild) {
    return interaction.reply({
      content: 'This command can only be used in a server.',
      ephemeral: true,
    });
  }

  const commandUser = interaction.member;
  const targetMember = await guild.members.fetch(targetUser.id);

  if (!commandUser || !targetMember) {
    return interaction.reply({
      content: 'Could not fetch user information.',
      ephemeral: true,
    });
  }

  guildLogsSchema.findOne({ guildId: guild.id }, async (err, requestData) => {
    if (err) throw err;
    if (requestData) {
      const loggingChannel = guild.channels.cache.get(requestData.channel);
      if (loggingChannel) {
        if (
          targetMember.roles.highest.rawPosition >=
          commandUser.roles.highest.rawPosition
        ) {
          loggingChannel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('Red')
                .setDescription(
                  `**${interaction.user.username}** (<@${interaction.user.id}>) tried to delete all messages from **${targetMember?.user?.username} (<@${targetMember?.user?.id}>)** but was denied.`
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
                `**${interaction.user.username}** (<@${interaction.user.id}>) has started the bulk removal messages from **${targetMember?.user?.username} (<@${targetMember?.user?.id}>)**.`
              ),
          ],
        });
      }
    }
  });

  if (
    targetMember.roles.highest.rawPosition >=
    commandUser.roles.highest.rawPosition
  ) {
    return interaction.reply({
      content:
        'You cannot purge messages from someone with an equal or higher role.',
      ephemeral: true,
    });
  }

  let deletedMessagesCount = 0;
  let statusUpdates = '';

  await interaction.reply({
    content: `Starting to delete messages from ${targetUser.tag}. This may take a while...`,
    ephemeral: true,
  });

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const channels = guild.channels.cache.filter(
    (channel) =>
      channel.type === ChannelType.GuildText ||
      channel.type === ChannelType.GuildAnnouncement ||
      channel.type === ChannelType.GuildForum ||
      channel.type === ChannelType.AnnouncementThread
  );

  const deleteMessages = async (
    channel: TextChannel | ThreadChannel<boolean>
  ) => {
    let lastMessageId: string | undefined;
    let messages;
    let threadHasTargetMessages = false;
    do {
      messages = await channel.messages.fetch({
        limit: 100,
        before: lastMessageId,
      });
      const targetMessages = messages.filter(
        (message) =>
          message.author.id === targetUser.id &&
          message.createdTimestamp >= sevenDaysAgo
      );

      if (targetMessages.size > 0) {
        threadHasTargetMessages = true;
      }

      await Promise.all(targetMessages.map((message) => message.delete()));
      deletedMessagesCount += targetMessages.size;

      lastMessageId = messages.size > 0 ? messages.last()!.id : undefined;
    } while (messages.size > 0);

    return threadHasTargetMessages;
  };

  await Promise.all(
    channels.map(async (channel) => {
      try {
        const threadHasTargetMessages = await deleteMessages(
          channel as TextChannel | ThreadChannel
        );
        if (threadHasTargetMessages && (channel as ThreadChannel).isThread()) {
          await (channel as ThreadChannel).delete();
          statusUpdates += `✅ Removed thread ${channel.name}\n`;
        } else {
          statusUpdates += `✅ Removed messages from ${channel.name}\n`;
        }
      } catch (error: any) {
        statusUpdates += `❌ Failed to remove messages from ${channel.name}: ${error.message}\n`;
      }
    })
  );

  await interaction.followUp({ content: statusUpdates, ephemeral: true });

  return interaction.followUp({
    content: `Deleted ${deletedMessagesCount} messages from ${targetUser.tag}.`,
    ephemeral: true,
  });
};
