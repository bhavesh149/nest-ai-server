import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatroomDocument = Chatroom & Document;

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Schema({ timestamps: true })
export class Chatroom {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description?: string;

  @Prop([{
    _id: { type: String, default: () => new Types.ObjectId().toString() },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }])
  messages: Message[];

  @Prop({ default: Date.now })
  lastActivity: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ChatroomSchema = SchemaFactory.createForClass(Chatroom);
