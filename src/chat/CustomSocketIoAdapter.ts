import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class CustomSocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    const optionsWithCors: ServerOptions = {
      ...options,
      cors: {
        origin: [process.env.FRONT_END,process.env.FRONT_END_CONSULTORES],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    };
    return super.createIOServer(port, optionsWithCors);
  }
}
