import { track } from '@amplitude/analytics-node';
import type { GuildMember } from 'discord.js';

import { joinReactionSchema } from '../../Schemas/joinReaction';

export const sendJoinReaction = async (member: GuildMember) => {
  joinReactionSchema.findOne(
    { guildId: member.guild.id },
    async (err: any, data: { emojiName: string; channel: string }) => {
      if (err) throw err;

      if (data) {
        console.log(`Welcome reaction enabled for ${member.guild.name}`);
        console.log(
          `Sending welcome reaction in ${data.channel} with emoji ${data.emojiName}`
        );

        const emojiInGuild = member.guild.emojis.cache.find(
          (e) => e.name?.includes(data.emojiName) || e.id === data.emojiName
        );
        const emojiId = emojiInGuild ? emojiInGuild.id : data.emojiName;

        // Add emoji to welcome message
        const welcomeChannel = member.guild.channels.cache.find(
          (channel) => channel.id === data.channel
        );

        if (!welcomeChannel || !emojiId) {
          if (!welcomeChannel) {
            console.log(`Cannot find the welcome channel ${welcomeChannel}`);
          } else {
            console.log(`Cannot find emoji ${data.emojiName}`);
          }
        }

        if (welcomeChannel) {
          const eventProperties = {
            guildId: member.guild.id,
            guildName: member.guild.name,
            userName: member.user.username,
            userId: member.user.id,
          };

          track(
            'Welcome',
            {
              type: 'Welcome Reaction',
              ...eventProperties,
            },
            {
              user_id: member.user.id,
              time: Date.now(),
            }
          );
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-shadow
          welcomeChannel.messages.fetch({ limit: 1 }).then((messages) => {
            // @ts-ignore
            messages.first().react(emojiId);
          });
        }
      }
    }
  );
};
