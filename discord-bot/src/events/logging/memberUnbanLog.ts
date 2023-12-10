import type { GuildBan } from 'discord.js';
import { AuditLogEvent, EmbedBuilder } from 'discord.js';

import { guildLogsSchema } from '../../Schemas/enableLogging';

export const memberUnbanLog = async (member: GuildBan) => {
  // @ts-ignore
  member.guild
    .fetchAuditLogs({
      type: AuditLogEvent.MemberBanRemove,
    })
    // @ts-ignore
    .then((audit) => {
      console.log(
        `Received unban event for ${
          member?.user?.tag || member?.user?.username
        } (${member.user.id})`
      );
      const executor = audit.entries.first();
      // @ts-ignore
      const { id } = member.user;
      const name = member.user.username;

      // If missing values or executor is a bot, return
      if (!id || !name || !executor || executor?.executor?.bot) return;

      // Check if loggin is enabled for this guild
      guildLogsSchema.findOne(
        // @ts-ignore
        { guildId: member.guild.id },
        async (err: any, data: { channel: string }) => {
          if (err) throw err;

          if (data) {
            // @ts-ignore
            const mChannel = member.guild.channels.cache.get(data.channel);
            if (!mChannel) return;
            const logEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('Member Unbanned')
              .addFields(
                {
                  name: 'Member Name',
                  value: `${name} (<@${id}>)`,
                  inline: false,
                },
                {
                  name: 'Member ID',
                  value: `${id}`,
                  inline: false,
                },
                {
                  name: 'Unbanned By',
                  value: `${executor?.executor?.username}#${executor?.executor?.discriminator}`,
                  inline: false,
                }
              );

            // @ts-ignore
            mChannel.send({ embeds: [logEmbed] });
          }
        }
      );
    });
};
