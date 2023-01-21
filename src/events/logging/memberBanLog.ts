import type { GuildBan } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

import { guildLogsSchema } from '../../Schemas/enableLogging';

export const memberBanLog = async (member: GuildBan) => {
  // @ts-ignore
  member.guild
    .fetchAuditLogs({
      // @ts-ignore
      type: AuditLogEvent.GuildBanAdd,
    })
    // @ts-ignore
    .then((audit) => {
      console.log(
        `Received ban event for ${member.user.tag} (${member.user.id})`
      );
      const executor = audit.entries.first();
      // @ts-ignore
      const { id } = member.user;
      const name = member.user.username;

      // If the executor is a bot or missing values then return
      if (!executor || !id || !name) return;

      // Check if logging is enabled for this guild
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
              .setTitle('Member Banned')
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
                  name: 'Banned By',
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
