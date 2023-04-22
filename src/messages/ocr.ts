import type { Message } from 'discord.js';
import type { Worker } from 'tesseract.js';
import { createWorker } from 'tesseract.js';

let workerPool: Worker[] = [];
const workerPoolSize = 1; // Adjust the pool size as needed
const workerStatuses: boolean[] = new Array(workerPoolSize).fill(false); // false indicates the worker is not busy

const createWorkerPool = async (poolSize: number): Promise<Worker[]> => {
  const workerPromises: Promise<Worker>[] = [];

  for (let i = 0; i < poolSize; i += 1) {
    const workerPromise = createWorker({ cacheMethod: 'none' });
    workerPromises.push(workerPromise);
  }

  return Promise.all(workerPromises);
};

const loadAndInitializeWorker = async (worker: Worker): Promise<void> => {
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
};

const initializeWorkerPool = async (): Promise<void> => {
  workerPool = await createWorkerPool(workerPoolSize);
  await Promise.all(
    workerPool.map((worker) => loadAndInitializeWorker(worker))
  );
};

initializeWorkerPool();

const getAvailableWorkerIndex = async (): Promise<number> => {
  for (let i = 0; i < workerStatuses.length; i += 1) {
    if (!workerStatuses[i]) {
      return i;
    }
  }

  // If no worker is available, create a new one and push it to the workerPool array
  const newWorker = await createWorker({ cacheMethod: 'none' });
  workerPool.push(newWorker);
  workerStatuses.push(false);
  return workerPool.length - 1;
};

const recognizeAndReply = async (
  url: string,
  message: Message
): Promise<void> => {
  const workerIndex = await getAvailableWorkerIndex();
  workerStatuses[workerIndex] = true; // Mark the worker as busy
  const worker = workerPool[workerIndex];

  try {
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

    // If there is an error with the worker, try to restart it
    try {
      await worker.terminate();
      const restartedWorker = await createWorker({ cacheMethod: 'none' });
      await restartedWorker.load();
      await restartedWorker.loadLanguage('eng');
      await restartedWorker.initialize('eng');
      workerPool[workerIndex] = restartedWorker;
    } catch (restartError) {
      console.error(restartError);
      console.log('Failed to restart the worker.');
    }
  } finally {
    workerStatuses[workerIndex] = false; // Mark the worker as available
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

process.on('exit', async () => {
  await Promise.all(workerPool.map((worker) => worker.terminate()));
});
