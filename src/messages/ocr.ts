import type { Message } from 'discord.js';
import type { Worker } from 'tesseract.js';
import { createWorker } from 'tesseract.js';

let workerPool: Worker[] = [];
const workerPoolSize = 4; // Adjust the pool size as needed
const availableWorkers: boolean[] = new Array(workerPoolSize).fill(true);

const createWorkerPool = async (poolSize: number): Promise<Worker[]> => {
  const workerPromises: Promise<Worker>[] = [];

  for (let i = 0; i < poolSize; i += 1) {
    const workerPromise = createWorker({ cacheMethod: 'none' });
    workerPromises.push(workerPromise);
  }

  return Promise.all(workerPromises);
};

const initializeWorkerPool = async (): Promise<void> => {
  workerPool = await createWorkerPool(workerPoolSize);
};

initializeWorkerPool();

const getAvailableWorkerIndex = (): Promise<number> => {
  return new Promise((resolve) => {
    const checkAvailability = () => {
      for (let i = 0; i < availableWorkers.length; i += 1) {
        if (availableWorkers[i]) {
          resolve(i);
          return;
        }
      }
      setTimeout(checkAvailability, 100); // Wait a bit before checking again
    };

    checkAvailability();
  });
};

const recognizeAndReply = async (
  url: string,
  message: Message
): Promise<void> => {
  const workerIndex = await getAvailableWorkerIndex();
  availableWorkers[workerIndex] = false;
  const worker = workerPool[workerIndex];

  try {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const {
      data: { text },
    } = await worker.recognize(url);

    if (text.includes('Prizes are not available')) {
      message.reply(
        `Beep boop! I noticed you uploaded an image with the text "Prizes are not available in your region." This typically means that you are in an unsupported country. The system can take time to detect your location, which might explain why you were able to participate in drops previously.`
      );
    }
  } catch (error) {
    console.error(error);
    console.log('Error while trying to OCR image.');
  } finally {
    availableWorkers[workerIndex] = true;
    await worker.terminate(); // Terminate the worker when it's no longer needed
  }
};

export const checkRegion = (message: Message): Promise<void> => {
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

  return Promise.all(tasks)
    .then(() => {
      console.log('All OCR tasks completed.');
    })
    .catch((error: any) => {
      console.error(error);
      console.log('Error while processing OCR tasks.');
    });
};
