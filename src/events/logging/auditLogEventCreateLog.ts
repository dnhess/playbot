// @ts-nocheck
import { AuditLogEvent, EmbedBuilder } from 'discord.js';

import { guildLogsSchema } from '../../Schemas/enableLogging';

export const auditLogEventCreateLog = async (auditLog) => {
  const { action, executorId, target, targetId } = auditLog;

  console.log(auditLog);

  if (action === AuditLogEvent.MessageDelete) {
    guildLogsSchema.findOne(
      { guildId: auditLog.guildId },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = auditLog.guild.channels.cache.get(data.channel);
          if (!mChannel) return;

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Message Deleted')
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
                name: 'Deleted By',
                value: `${executorId.username}#${executorId.discriminator}`,
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
      { guildId: auditLog.guildId },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = auditLog.guild.channels.cache.get(data.channel);
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
                value: `${executorId.username}#${executorId.discriminator}`,
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
      { guildId: auditLog.guildId },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = auditLog.guild.channels.cache.get(data.channel);
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
                value: `${executorId.username}#${executorId.discriminator}`,
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
      { guildId: auditLog.guildId },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = auditLog.guild.channels.cache.get(data.channel);
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
                value: `${executorId.username}#${executorId.discriminator}`,
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
      { guildId: auditLog.guildId },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = auditLog.guild.channels.cache.get(data.channel);
          if (!mChannel) return;

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Member Kicked')
            .addFields(
              {
                name: 'Member',
                value: `${targetId.username}#${targetId.discriminator}`,
                inline: false,
              },
              {
                name: 'Kicked By',
                value: `${executorId.username}#${executorId.discriminator}`,
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
      { guildId: auditLog.guildId },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = auditLog.guild.channels.cache.get(data.channel);
          if (!mChannel) return;

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Member Banned')
            .addFields(
              {
                name: 'Member',
                value: `${targetId.username}#${targetId.discriminator}`,
                inline: false,
              },
              {
                name: 'Banned By',
                value: `${executorId.username}#${executorId.discriminator}`,
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
      { guildId: auditLog.guildId },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = auditLog.guild.channels.cache.get(data.channel);
          if (!mChannel) return;

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Member Unbanned')
            .addFields(
              {
                name: 'Member',
                value: `${targetId.username}#${targetId.discriminator}`,
                inline: false,
              },
              {
                name: 'Unbanned By',
                value: `${executorId.username}#${executorId.discriminator}`,
                inline: false,
              }
            );

          mChannel.send({ embeds: [logEmbed] });
        }
      }
    );
  }
};
