import type { Client, ModalSubmitInteraction } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

import { welcomeDMSchema } from '../../Schemas/welcomeDM';

export const modalWelcomeDM = async (
  interaction: ModalSubmitInteraction,
  client: Client
) => {
  const { customId } = interaction;

  // Get all the next in customId after welcome-modal-btn-
  const guildId = customId.split('welcome-modal-')[1];
  // Get the guild from welcomeDM schema
  welcomeDMSchema.findOne(
    { guildID: guildId },
    async (
      err: any,
      data: {
        messages: string[];
        title: string;
        channel: string;
        reply: string;
      }
    ) => {
      if (err) throw err;

      if (data) {
        // Get all text input values from modal

        type TextInputResponse = {
          name: string;
          value: string;
        };

        const responses: TextInputResponse[] = [];

        data.messages.forEach((message, index) => {
          // If message is null or undefined, return
          if (!message) return;
          const response = interaction.fields.getTextInputValue(
            `welcome-message-${index}`
          );
          responses.push({
            name: message,
            value: response,
          });
        });

        console.log(`Received responses from welcome-modal-${guildId}`);
        // Post inbed to channel
        const embed = new EmbedBuilder()
          .setTitle('Welcome Form Response')
          .setDescription(
            `Welcome form response from ${interaction.user.username}#${interaction.user?.discriminator}`
          )
          .addFields(responses);

        // Get the channel name from the interaction
        const adminChannel = client.channels.cache.find(
          // @ts-ignore
          (channel) => channel.id === data.channel
        );

        console.log(`Channel Name to send data to: ${adminChannel}`);

        if (!adminChannel) return;

        if (adminChannel) {
          // @ts-ignore
          await adminChannel.send({ embeds: [embed] });
        }

        interaction.reply(data.reply);
      }
    }
  );
};
