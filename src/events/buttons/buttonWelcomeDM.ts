import type { ButtonInteraction } from 'discord.js';
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import { welcomeDMSchema } from '../../Schemas/welcomeDM';

export const buttonWelcomeDM = async (interaction: ButtonInteraction) => {
  const { customId } = interaction;

  // Get all the next in customId after welcome-modal-btn-
  const guildId = customId.split('welcome-modal-btn-')[1];

  welcomeDMSchema.findOne(
    { guildID: guildId },
    async (
      err: any,
      data: { messages: string[]; title: string; guildId: string }
    ) => {
      if (err) throw err;

      if (data) {
        const welcomeModal = new ModalBuilder()
          .setTitle(data.title)
          .setCustomId(`welcome-modal-${data.guildId}`);

        // Build inputs for each message
        data.messages.forEach((message, index) => {
          // If message is null or undefined, return
          if (!message) return;

          const input = new TextInputBuilder()
            .setCustomId(`welcome-message-${index}`)
            .setLabel(`${message}`)
            .setMinLength(3)
            .setStyle(TextInputStyle.Paragraph);

          const actionRow = new ActionRowBuilder().addComponents(input);
          // @ts-ignore
          welcomeModal.addComponents(actionRow);
        });

        await interaction.showModal(welcomeModal);
      }
    }
  );
};
