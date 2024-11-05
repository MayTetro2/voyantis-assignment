import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const queues: Map<string, string[]> = new Map<string, string[]>();

app.post('/api/v1/:queue_name', (req: Request, res: Response) => {
    const queueName = req.params.queue_name;
    const message = req.body.message;

    if (!message) {
      return res.status(400).send({ error: 'Message is required in the body' });
    }

    if (!queues.has(queueName)) {
      queues.set(queueName, []);
    }

    queues.get(queueName)!.push(message);
    res.status(201).send({ message: `Message added to queue ${queueName}` });

});


app.get('/api/v1/:queue_name', async (req: Request, res: Response) => {
  const queueName = req.params.queue_name;
  const timeout = parseInt(req.query.timeout as string) || 10000;
  const message = await getNextMessage(queueName, timeout);
  if (message === null) {
    return res.status(204).send();
  }

  res.status(200).send({ message });

});

const getNextMessage = (queueName: string, timeout: number): Promise<string | null> => {
  return new Promise((resolve) => {
    const pollInterval = 100;

    const checkQueue = () => {
      if (queues.has(queueName) && queues.get(queueName)!.length > 0) {
        resolve(queues.get(queueName)!.shift() || null);
      } else if (timeout <= 0) {
        resolve(null);
      } else {
        timeout -= pollInterval;
        setTimeout(checkQueue, pollInterval);
      }
    };

    checkQueue();
  });
  };

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});