import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class GroqService {
  private groq: Groq;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('groq.apiKey');
    this.groq = new Groq({
      apiKey: apiKey || '',
    });
  }

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: messages,
        model: 'llama3-8b-8192', // Using Llama 3 model
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      });

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Groq API Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  generateStreamResponse(messages: ChatMessage[]): Observable<string> {
    return new Observable((subscriber) => {
      this.groq.chat.completions
        .create({
          messages: messages,
          model: 'llama3-8b-8192',
          temperature: 0.7,
          max_tokens: 1024,
          stream: true,
        })
        .then(async (stream) => {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              subscriber.next(content);
            }
          }
          subscriber.complete();
        })
        .catch((error) => {
          console.error('Groq Streaming Error:', error);
          subscriber.error(new Error('Failed to stream AI response'));
        });
    });
  }

  generateChatTitle(firstMessage: string): string {
    // Generate a title from the first message (first 50 characters)
    const title = firstMessage.length > 50 
      ? firstMessage.substring(0, 50) + '...' 
      : firstMessage;
    return title;
  }
}
