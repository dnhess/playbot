import type { Message } from 'discord.js';
import Tesseract from 'tesseract.js';

const recognizeAndReply = (url: string, message: Message) => {
  return Tesseract.recognize(url, 'eng', { cacheMethod: 'none' })
    .then(({ data: { text } }) => {
      if (text.includes('Prizes are not available')) {
        message.reply(
          `Beep boop! I noticed you uploaded an image with the text "Prizes are not available in your region." This typically means that you are in an unsupported country. The system can take time to detect your location, which might explain why you were able to participate in drops previously.`
        );
      }
    })
    .catch((error: any) => {
      console.error(error);
      console.log('Error while trying to OCR image.');
    });
};

export const checkRegion = (message: Message) => {
  const tasks = message.attachments
    .filter((attachment: { url: string }) => {
      const { url } = attachment;
      return (
        url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg')
      );
    })
    .map((attachment: { url: string }) => {
      return recognizeAndReply(attachment.url, message);
    });

  Promise.all(tasks)
    .then(() => {
      console.log('All OCR tasks completed.');
    })
    .catch((error: any) => {
      console.error(error);
      console.log('Error while processing OCR tasks.');
    });
};
