import type { Message, PartialMessage } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

import { guildLogsSchema } from '../../Schemas/enableLogging';

export const messageUpdateLog = async (
  message: Message | PartialMessage,
  newMessage: Message | PartialMessage
) => {
  // @ts-ignore
  message.guild
    .fetchAuditLogs({
      // @ts-ignore
      type: AuditLogEvent.MessageUpdate,
    })
    // @ts-ignore
    .then((audit) => {
      const executor = audit.entries.first();
      // @ts-ignore
      const mes = message.content;

      // If the message is from a bot, return
      if (message?.author?.bot || !executor || !mes) return;

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
              .setTitle('Message Edited')
              .addFields(
                {
                  name: 'Old Message Content',
                  value: `${mes}`,
                  inline: false,
                },
                {
                  name: 'New Message Content',
                  value: `${newMessage}`,
                  inline: false,
                },
                {
                  name: 'Member Channel',
                  value: `${message.channel}`,
                  inline: false,
                },
                {
                  name: 'Edited By',
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
