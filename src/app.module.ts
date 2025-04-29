import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    MongooseModule.forRoot("mongodb://chat_admin:%40ContaPlus%24.6487@147.93.33.226:27017/chat"),
    ChatModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
