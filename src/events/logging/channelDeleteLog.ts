import type { DMChannel, NonThreadGuildBasedChannel } from 'discord.js';
import { AuditLogEvent, EmbedBuilder } from 'discord.js';

import { guildLogsSchema } from '../../Schemas/enableLogging';

export const channelDeleteLog = async (
  channel: DMChannel | NonThreadGuildBasedChannel
) => {
  // @ts-ignore
  channel.guild
    .fetchAuditLogs({
      type: AuditLogEvent.ChannelDelete,
    })
    // @ts-ignore
    .then((audit) => {
      const executor = audit.entries.first();
      // @ts-ignore
      const { name, id, type } = channel;

      // If missing values or is a bot return
      if (!name || !id || !type || executor?.executor?.bot) return;

      let typeText = '';

      // @ts-ignore
      if (type === 0) {
        typeText = 'Text';
      } else if (type === 2) {
        typeText = 'Voice';
      } else if (type === 4) {
        typeText = 'Category';
      } else if (type === 5) {
        typeText = 'News';
      } else if (type === 15) {
        typeText = 'Forum';
      }

      console.log(`Channel created: ${name} (${id}) of type ${type}`);

      // Check if loggin is enabled for this guild
      guildLogsSchema.findOne(
        // @ts-ignore
        { guildId: channel.guild.id },
        async (err: any, data: { channel: string }) => {
          if (err) throw err;

          if (data) {
            // @ts-ignore
            const mChannel = channel.guild.channels.cache.get(data.channel);
            if (!mChannel) return;
            const logEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('Channel Deleted')
              .addFields(
                {
                  name: 'Channel Name',
                  value: `${name}`,
                  inline: false,
                },
                {
                  name: 'Channel Type',
                  value: `${typeText}`,
                  inline: false,
                },
                {
                  name: 'Channel ID',
                  value: `${id}`,
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
