import type { GuildMember } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

import { welcomeSchema } from '../../Schemas/welcome';

export const sendWelcome = async (member: GuildMember) => {
  welcomeSchema.findOne(
    { guildId: member.guild.id },
    async (err: any, data: { channel: string }) => {
      if (err) throw err;

      if (data) {
        console.log(`Welcome message enabled for ${member.guild.name}`);
        console.log(`Sending welcome message to ${data.channel}`);
        const welcomeChannel = member.guild.channels.cache.find(
          (channel) => channel.id === data.channel
        );

        if (!welcomeChannel) return;

        if (welcomeChannel) {
          const welcomeEmbed = new EmbedBuilder()
            .setTitle('Welcome to the server!')
            .setDescription(
              `${member} has joined the server! Make sure to read the rules!`
            )
            .setThumbnail(member.user.avatarURL())
            .setColor('#00ff00');

          // @ts-ignore
          welcomeChannel.send({ embeds: [welcomeEmbed] });
        }
      }
    }
  );
};
