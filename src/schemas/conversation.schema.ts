import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface Message {
  id: string;
  name: string;
  text: string;
  timestamp: Date;
}

export type ConversationDocument = Conversation & Document;

@Schema({ collection: 'Conversation', timestamps: true })
export class Conversation {
  @Prop()
  consultorId: string;

  @Prop()
  clienteId: string;

  @Prop()
  nomeCliente: string;
  
  @Prop()
  nomeConsultor: string;
  
  @Prop({ type: Array })
  messages: Message[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
