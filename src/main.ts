import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CustomSocketIoAdapter } from './chat/CustomSocketIoAdapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3012;
  const date = new Date;
  const currentTime = date.toLocaleTimeString('pt-BR', { hour12: false });

  const config = new DocumentBuilder()
  .setTitle('Chat API')
  .setDescription('Está é uma api do chat entre consultor e cliente')
  .setVersion('1.0')
  .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useWebSocketAdapter(new CustomSocketIoAdapter(app))
  app.enableCors();

  await app.listen(port);
  console.log('port: '+port)
  console.log('connected '+currentTime)
}
bootstrap();
