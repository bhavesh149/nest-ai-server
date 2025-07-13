import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold 
} from '@google/generative-ai';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 20, // Reduced for faster response
        topP: 0.8, // Reduced for faster response
        maxOutputTokens: 512, // Reduced for faster response
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    try {
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
      });

      // Convert messages to Gemini format
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts }]
      }));

      const lastMessage = messages[messages.length - 1];

      // Create chat session with history
      const chat = this.model.startChat({
        history: history,
      });

      // Race between the actual request and timeout
      const result = await Promise.race([
        chat.sendMessage(lastMessage.parts),
        timeoutPromise
      ]);

      const response = await (result as any).response;
      
      return response.text() || 'No response generated';
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Provide fallback response for timeout or API errors
      if (error.message === 'Request timeout') {
        return 'I apologize, but I\'m experiencing some delays. Please try asking your question again.';
      }
      
      throw new Error('Failed to generate AI response');
    }
  }

  generateStreamResponse(messages: ChatMessage[]): Observable<string> {
    return new Observable((subscriber) => {
      this.generateStreamResponseInternal(messages, subscriber);
    });
  }

  private async generateStreamResponseInternal(messages: ChatMessage[], subscriber: any): Promise<void> {
    try {
      // Convert messages to Gemini format
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts }]
      }));

      const lastMessage = messages[messages.length - 1];

      // Create chat session with history
      const chat = this.model.startChat({
        history: history,
      });

      const result = await chat.sendMessageStream(lastMessage.parts);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          subscriber.next(chunkText);
        }
      }
      
      subscriber.complete();
    } catch (error) {
      console.error('Gemini Streaming Error:', error);
      subscriber.error(new Error('Failed to stream AI response'));
    }
  }

  generateChatTitle(firstMessage: string): string {
    // Generate a title from the first message (first 50 characters)
    const title = firstMessage.length > 50 
      ? firstMessage.substring(0, 50) + '...' 
      : firstMessage;
    return title;
  }
}
