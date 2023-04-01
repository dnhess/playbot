import type { Message } from 'discord.js';
import Tesseract from 'tesseract.js';

export const checkRegion = (message: Message) => {
  message.attachments.forEach((attachment: { url: any }) => {
    const { url } = attachment;
    Tesseract.recognize(url).then(({ data: { text } }) => {
      // Reply to the message with the text if it contains the phrase "Prizes are not available"
      if (text.includes('Prizes are not available')) {
        message.reply(
          `Beep boop! I noticed you uploaded an image with the text "Prizes are not available in your region." This typically means that you are in an unsupported country. The system can take time to detect your location, which might explain why you were able to participate in drops previously.`
        );
      }
    });
  });
};
