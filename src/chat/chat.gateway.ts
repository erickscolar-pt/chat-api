import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) { }

  @WebSocketServer() server: Server;
  private clients = new Map<string, { socketId: string; role: 'consultor' | 'cliente' }>();
  private logger: Logger = new Logger('ChatGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket server initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    client.on('register', async ({ userId, role, consultorId, clienteId, name }) => {
      const connectionId: string = role === 'cliente' ? clienteId : consultorId;
      console.log(clienteId)
      console.log(consultorId)
      //this.clients.set(connectionId, { socketId: String(userId), role });
      this.logger.log(`Map antes de adicionar: ${JSON.stringify([...this.clients])}`);
      this.clients.set(connectionId, { socketId: client.id, role });
      this.logger.log(`Map depois de adicionar: ${JSON.stringify([...this.clients])}`);


      // Recuperar histórico de mensagens se consultor e cliente estiverem definidos
      if (consultorId && clienteId) {
        const result = await this.chatService.getConversation(consultorId, clienteId);

        if (result.success) {
          client.emit('conversationHistory', result.data?.messages);
        } else {
          client.emit('error', { message: result.message });
        }
      }

      if (role === 'consultor') {
        const conversations = await this.chatService.getConversationsByConsultorId(userId);
        client.emit('conversationList', conversations);
      }
    });
  }

  handleDisconnect(client: Socket) {
    const user = [...this.clients.entries()].find(([, value]) => value.socketId === client.id);
    if (user) {
      this.clients.delete(user[0]);
      this.logger.log(`Client disconnected: ${client.id}, UserId: ${user[0]}`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('msgToServer')
  async handleMessage(
    client: Socket,
    payload: { name: string; sender: string; text: string; targetRole: 'consultor' | 'cliente'; targetUserId: string; consultorId: string; clienteId: string }
  ) {
    const { name, sender, text, consultorId, clienteId, targetUserId, targetRole } = payload;
    console.log(payload);

    // Salvar mensagem no banco de dados
    await this.chatService.createOrUpdateConversation(consultorId, clienteId, sender, text, name, targetRole);

    // Enviar mensagem para o destinatário, se conectado
    console.log("Mapa de clientes:", [...this.clients]);
    console.log("Procurando targetUserId:", targetUserId);
    const target = this.clients.get(targetUserId);

    if (target) {
      this.server.to(target.socketId).emit('msgToClient', { consultorId, clienteId, sender, text, name, targetRole });
      this.logger.log(`Mensagem roteada para ${target.role} (${target.socketId}): ${text}`);
    } else {
      this.logger.warn(`Usuário alvo não encontrado: ${targetUserId}`);
    }
  }

  @SubscribeMessage('getConversation')
  async handleGetConversation(client: Socket, payload: { consultorId: string; clienteId: string }) {
    const { consultorId, clienteId } = payload;
    const result = await this.chatService.getConversation(consultorId, clienteId);

    console.log(result)
    if (result.success) {
      client.emit('conversationHistory', result.data?.messages);
    } else {
      client.emit('error', { message: result.message });
    }
  }

  @SubscribeMessage('getConversationsByConsultorId')
  async handleGetConversations(client: Socket, payload: { consultorId: string }) {
    const { consultorId } = payload;

    const result = await this.chatService.getConversationsByConsultorId(consultorId);

    if (result.success) {
      client.emit('consultorConversations', result.data);
    } else {
      client.emit('error', { message: result.message });
    }
  }

}
