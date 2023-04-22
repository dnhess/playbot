import type { Message } from 'discord.js';
import type { Worker } from 'tesseract.js';
import { createWorker } from 'tesseract.js';

let worker: Worker | null = null;
const initializeWorker = async (): Promise<void> => {
  worker = await createWorker({ cacheMethod: 'none' });
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
};

initializeWorker();

const queue: { url: string; message: Message }[] = [];
let isProcessing = false;

const recognizeWithWorker = async (url: string): Promise<string> => {
  if (!worker) {
    worker = await createWorker({ cacheMethod: 'none' });
  }

  await worker.loadLanguage('eng');
  await worker.initialize('eng');

  const {
    data: { text },
  } = await worker.recognize(url);

  return text;
};

const processQueue = async () => {
  if (queue.length === 0 || isProcessing) return;
  isProcessing = true;

  const item = queue.shift();
  const url = item?.url;
  const message = item?.message;

  if (url && message) {
    try {
      const text = await recognizeWithWorker(url);

      if (text.includes('Prizes are not available')) {
        message.reply(
          `Beep boop! I noticed you uploaded an image with the text "Prizes are not available in your region." This typically means that you are in an unsupported country. The system can take time to detect your location, which might explain why you were able to participate in drops previously.`
        );
      }
    } catch (error) {
      console.error(error);
      console.log('Error while trying to OCR image.');
    } finally {
      isProcessing = false;
      if (queue.length === 0) {
        await worker?.terminate();
        worker = null;
      } else {
        processQueue();
      }
    }
  }
};

export const checkRegion = (message: Message<boolean>): void => {
  const attachmentsToProcess = message.attachments.filter(
    (attachment: { url: string }) => {
      const { url } = attachment;
      return (
        url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg')
      );
    }
  );

  attachmentsToProcess.forEach((attachment) => {
    queue.push({ url: attachment.url, message });
    processQueue();
  });
};

process.on('exit', async () => {
  if (worker) {
    await worker.terminate();
  }
});
