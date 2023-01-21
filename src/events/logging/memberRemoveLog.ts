import type { GuildMember, PartialGuildMember } from 'discord.js';
import { AuditLogEvent, EmbedBuilder } from 'discord.js';

import { guildLogsSchema } from '../../Schemas/enableLogging';

export const memberRemoveLog = async (
  member: GuildMember | PartialGuildMember
) => {
  // @ts-ignore
  member.guild
    .fetchAuditLogs({
      type: AuditLogEvent.MemberKick,
    })
    // @ts-ignore
    .then((audit) => {
      const executor = audit.entries.first();
      // @ts-ignore
      const { id } = member.user;
      const name = member.user.username;

      if (executor?.action !== AuditLogEvent.MemberKick) return;

      // If missing values or message is from a bot return
      if (!executor || !id || !name || member?.user?.bot) return;

      // If user kicked themselves return
      if (executor?.executor?.id === id) return;

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
              .setTitle('Member Kicked')
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
                  name: 'Kicked By',
                  value: `${executor?.executor?.username}#${executor?.executor?.discriminator}`,
                  inline: false,
                },
                {
                  name: 'Reason',
                  value: `${executor?.reason}`,
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
