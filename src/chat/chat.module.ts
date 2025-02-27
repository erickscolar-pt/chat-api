import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Conversation, ConversationSchema } from "src/schemas/conversation.schema";
import { ChatService } from './chat.service';
import { ChatGateway } from "./chat.gateway";


@Module({
    imports: [
      MongooseModule.forFeature([
        { name: Conversation.name, schema: ConversationSchema },
      ]),
      
    ],
    providers: [ChatService, ChatGateway],
    exports: [ChatService],
  })
  export class ChatModule {}
  