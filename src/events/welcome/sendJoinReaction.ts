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
        // Get emoji name from guild.emoji
        const emoji = member.guild.emojis.cache.find(
          // eslint-disable-next-line @typescript-eslint/no-shadow
          (emoji) => emoji.name === data.emojiName
        );

        // Add emoji to welcome message
        const welcomeChannel = member.guild.channels.cache.find(
          (channel) => channel.id === data.channel
        );

        if (!welcomeChannel || !emoji) return;

        if (welcomeChannel) {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-shadow
          welcomeChannel.messages.fetch({ limit: 1 }).then((messages) => {
            // @ts-ignore
            messages.first().react(emoji);
          });
        }
      }
    }
  );
};
