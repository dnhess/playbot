// @ts-nocheck
import { AuditLogEvent, EmbedBuilder } from 'discord.js';
import { DateTime } from 'luxon';

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
                value: `${target.username}#${target?.discriminator} (<@${target?.id}>)`,
                inline: false,
              },
              {
                name: 'Member Channel',
                value: `${auditLog.extra.channel}`,
                inline: false,
              },
              {
                name: 'Deleted By',
                value: `${executor.username}#${executor?.discriminator} (<@${executor?.id}>)`,
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
                value: `${target.rawPosition}`,
                inline: false,
              },
              {
                name: 'Deleted By',
                value: `${executor.username}#${executor.discriminator} (<@${executor?.id}>)`,
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

          // Fetch the most recent kick
          const recentAuditLog = await guild.fetchAuditLogs(
            1,
            null,
            AuditLogEvent.MemberKick
          );

          const kickReason = recentAuditLog.entries.first()?.reason;

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Member Kicked')
            .addFields(
              {
                name: 'Member',
                value: `${target.username}#${target?.discriminator} (<@${target?.id}>)`,
                inline: false,
              },
              {
                name: 'Kicked By',
                value: `${executor.username}#${executor?.discriminator} (<@${executor?.id}>)`,
                inline: false,
              },
              {
                name: 'Reason',
                value: `${kickReason}`,
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

          // Fetch the most recent ban
          const recentAuditLog = await guild.fetchAuditLogs(
            1,
            null,
            AuditLogEvent.MemberBanAdd
          );

          const banReason = recentAuditLog.entries.first()?.reason;

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Member Banned')
            .addFields(
              {
                name: 'Member',
                value: `${target.username}#${target?.discriminator} (<@${target?.id}>)`,
                inline: false,
              },
              {
                name: 'Banned By',
                value: `${executor.username}#${executor?.discriminator} (<@${executor?.id}>)`,
                inline: false,
              },
              {
                name: 'Reason',
                value: `${banReason}`,
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
                value: `${target.username}#${target?.discriminator} (<@${target?.id}>)`,
                inline: false,
              },
              {
                name: 'Unbanned By',
                value: `${executor.username}#${executor?.discriminator} (<@${executor?.id}>)`,
                inline: false,
              }
            );

          mChannel.send({ embeds: [logEmbed] });
        }
      }
    );
  }

  // Audit Log Events for timeouts
  if (action === AuditLogEvent.MemberUpdate) {
    guildLogsSchema.findOne(
      { guildId: guild.id },
      async (err: any, data: { channel: string }) => {
        if (err) throw err;

        if (data) {
          const mChannel = guild.channels.cache.get(data.channel);
          if (!mChannel) return;

          if (auditLog?.changes?.[0]?.key !== 'communication_disabled_until')
            return;

          // fetch recent audit log
          const recentAuditLog = await guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberUpdate,
          });

          const reasonForTimeout = recentAuditLog?.entries?.first()?.reason;

          const currentTime = DateTime.local();
          const timeoutEnd = DateTime.fromISO(
            (auditLog?.changes?.[0]?.new as string) ?? ''
          );

          const timeUntilTimeoutEnd = timeoutEnd.diff(currentTime);
          const timedOutFor = timeUntilTimeoutEnd.toFormat(
            "dd 'days', hh 'hours', mm 'minutes', ss 'seconds'"
          );

          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Member Timeout')
            .addFields(
              {
                name: 'Member Name',
                value: `${target.username}#${target?.discriminator} (<@${target?.id}>)`,
                inline: false,
              },
              {
                name: 'Timeout By',
                value: `${executor.username}#${executor?.discriminator} (<@${executor?.id}>)`,
                inline: false,
              },
              {
                name: 'Duration',
                value: `${timedOutFor}`,
              },
              {
                name: 'Reason',
                value: `${reasonForTimeout}`,
                inline: false,
              }
            );

          mChannel.send({ embeds: [logEmbed] });
        }
      }
    );
  }
};
