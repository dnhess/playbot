// @ts-nocheck
import { AuditLogEvent, EmbedBuilder } from 'discord.js';

import { guildLogsSchema } from '../../Schemas/enableLogging';

export const auditLogEventCreateLog = async (auditLog, guild) => {
  const { action, target, executor } = auditLog;

  if (action === AuditLogEvent.MessageDelete) {
    guildLogsSchema.findOne(
      { guildId: guild.id },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = guild.channels.cache.get(data.channel);
          if (!mChannel) return;

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Message Deleted')
            .addFields(
              {
                name: 'Message From',
                value: `${target.username}#${target.discriminator}`,
                inline: false,
              },
              {
                name: 'Member Channel',
                value: `${auditLog.extra.channel}`,
                inline: false,
              },
              {
                name: 'Deleted By',
                value: `${executor.username}#${executor.discriminator}`,
                inline: false,
              }
            );

          mChannel.send({ embeds: [logEmbed] });
        }
      }
    );
  }

  if (action === AuditLogEvent.MessageBulkDelete) {
    guildLogsSchema.findOne(
      { guildId: guild.id },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = guild.channels.cache.get(data.channel);
          if (!mChannel) return;

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Message Bulk Deleted')
            .addFields(
              {
                name: 'Message Count',
                value: `${target.count}`,
                inline: false,
              },
              {
                name: 'Deleted By',
                value: `${executor.username}#${executor.discriminator}`,
                inline: false,
              }
            );

          mChannel.send({ embeds: [logEmbed] });
        }
      }
    );
  }

  if (action === AuditLogEvent.MessagePin) {
    guildLogsSchema.findOne(
      { guildId: guild.id },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = guild.channels.cache.get(data.channel);
          if (!mChannel) return;

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Message Pinned')
            .addFields(
              {
                name: 'Message Content',
                value: `${target.content}`,
                inline: false,
              },
              {
                name: 'Member Channel',
                value: `${target.channel}`,
                inline: false,
              },
              {
                name: 'Pinned By',
                value: `${executor.username}#${executor.discriminator}`,
                inline: false,
              }
            );

          mChannel.send({ embeds: [logEmbed] });
        }
      }
    );
  }

  if (action === AuditLogEvent.MessageUnpin) {
    guildLogsSchema.findOne(
      { guildId: guild.id },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = guild.channels.cache.get(data.channel);
          if (!mChannel) return;

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Message Unpinned')
            .addFields(
              {
                name: 'Message Content',
                value: `${target.content}`,
                inline: false,
              },
              {
                name: 'Member Channel',
                value: `${target.channel}`,
                inline: false,
              },
              {
                name: 'Unpinned By',
                value: `${executor.username}#${executor.discriminator}`,
                inline: false,
              }
            );

          mChannel.send({ embeds: [logEmbed] });
        }
      }
    );
  }

  if (action === AuditLogEvent.MemberKick) {
    guildLogsSchema.findOne(
      { guildId: guild.id },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = guild.channels.cache.get(data.channel);
          if (!mChannel) return;

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Member Kicked')
            .addFields(
              {
                name: 'Member',
                value: `${target.username}#${target.discriminator}`,
                inline: false,
              },
              {
                name: 'Kicked By',
                value: `${executor.username}#${executor.discriminator}`,
                inline: false,
              },
              {
                name: 'Reason',
                value: `${target?.reason}`,
                inline: false,
              }
            );

          mChannel.send({ embeds: [logEmbed] });
        }
      }
    );
  }

  if (action === AuditLogEvent.MemberBanAdd) {
    guildLogsSchema.findOne(
      { guildId: guild.id },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = guild.channels.cache.get(data.channel);
          if (!mChannel) return;

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Member Banned')
            .addFields(
              {
                name: 'Member',
                value: `${target.username}#${target.discriminator}`,
                inline: false,
              },
              {
                name: 'Banned By',
                value: `${executor.username}#${executor.discriminator}`,
                inline: false,
              },
              {
                name: 'Reason',
                value: `${target?.reason}`,
                inline: false,
              }
            );

          mChannel.send({ embeds: [logEmbed] });
        }
      }
    );
  }

  if (action === AuditLogEvent.MemberBanRemove) {
    guildLogsSchema.findOne(
      { guildId: guild.id },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = guild.channels.cache.get(data.channel);
          if (!mChannel) return;

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Member Unbanned')
            .addFields(
              {
                name: 'Member',
                value: `${target.username}#${target.discriminator}`,
                inline: false,
              },
              {
                name: 'Unbanned By',
                value: `${executor.username}#${executor.discriminator}`,
                inline: false,
              }
            );

          mChannel.send({ embeds: [logEmbed] });
        }
      }
    );
  }
};
