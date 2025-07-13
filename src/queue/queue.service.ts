import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface MessageJobData {
  userId: string;
  chatId: string;
  message: string;
  history?: Array<{ role: string; content: string }>;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('message-queue') private messageQueue: Queue,
  ) {}

  async addMessageJob(data: MessageJobData): Promise<any> {
    try {
      return this.messageQueue.add('process-message', data, {
        delay: 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
    } catch (error) {
      console.error('Queue error:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.messageQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      progress: job.progress(),
      failedReason: job.failedReason,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      returnvalue: job.returnvalue,
      data: job.data,
    };
  }

  async getQueueStats(): Promise<any> {
    const waiting = await this.messageQueue.getWaiting();
    const active = await this.messageQueue.getActive();
    const completed = await this.messageQueue.getCompleted();
    const failed = await this.messageQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }
}
