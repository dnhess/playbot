import type { Message, PartialMessage } from 'discord.js';
import { AuditLogEvent, EmbedBuilder } from 'discord.js';

import { guildLogsSchema } from '../../Schemas/enableLogging';

export const messageDeleteLog = async (message: Message | PartialMessage) => {
  if (!message.guild) return;
  message.guild
    .fetchAuditLogs({
      type: AuditLogEvent.MessageDelete,
    })
    // @ts-ignore
    .then((audit) => {
      const executor = audit.entries.first();
      // @ts-ignore
      const mes = message.content;

      // If missing values or message is from a bot return
      if (!mes || message?.author?.bot || !executor) return;

      // If executor is older than 3 seconds return
      if (Date.now() - executor.createdTimestamp > 3000) return;

      // Check if loggin is enabled for this guild
      guildLogsSchema.findOne(
        // @ts-ignore
        { guildId: message.guild.id },
        async (err: any, data: { channel: string }) => {
          if (err) throw err;

          if (data) {
            // @ts-ignore
            const mChannel = message.guild.channels.cache.get(data.channel);
            if (!mChannel) return;

            const logEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('Message Deleted')
              .addFields(
                {
                  name: 'Message Content',
                  value: `${mes}`,
                  inline: false,
                },
                {
                  name: 'Member Channel',
                  value: `${message.channel}`,
                  inline: false,
                },
                {
                  name: 'Deleted By',
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
