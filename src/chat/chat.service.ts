import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument, Message } from 'src/schemas/conversation.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Conversation.name) private conversation: Model<ConversationDocument>,
  ) {}

  /**
   * Cria ou atualiza uma conversa com uma nova mensagem.
   */
  async createOrUpdateConversation(
    consultorId: string,
    clienteId: string,
    sender: string,
    text: string,
    name?: string,
    targetRole?: 'consultor' | 'cliente'
  ): Promise<Object> {
    try {
      // Busca a conversa existente
      let conversation = await this.conversation.findOne({ consultorId, clienteId });
  
      if (!conversation) {
        // Se não existir, cria uma nova conversa
        conversation = await this.conversation.create({
          consultorId,
          clienteId,
          nomeCliente: targetRole === 'consultor' ? name : '',
          nomeConsultor: targetRole === 'cliente' ? name : '',
          messages: [],
        });
      }
  
      // Adiciona a mensagem à lista de mensagens
      conversation.messages.push({
        id: uuidv4(),
        name,
        text,
        timestamp: new Date(),
      });
  
      // Marca o campo como modificado e salva
      conversation.markModified('messages');
      const updatedConversation = await conversation.save();
  
      this.logger.log(`Conversation updated for ${consultorId} and ${clienteId}`);
      return updatedConversation;
    } catch (error) {
      this.logger.error('Error saving conversation:', error);
      throw new Error('Failed to save conversation');
    }
  }
  
  

  /**
   * Retorna uma conversa específica entre consultor e cliente.
   */
  async getConversation(consultorId: string, clienteId: string): Promise<{ success: boolean; data?: Conversation; message?: string }> {
    try {

      const conversation = await this.conversation.findOne({
        consultorId: String(consultorId),
        clienteId: String(clienteId),
      });

      const conversationConsultor = await this.conversation.findOne({consultorId})
      
      if (!conversation) {
        return {
          success: false,
          message: 'No conversation found for the given consultorId and clienteId.',
        };
      }
  
      if(!conversationConsultor){
        return {
          success: false,
          message: 'No conversation found for the given consultorId.',
        };
      }

      if(consultorId && clienteId){
        return {
          success: true,
          data: conversation,
        };
      }

      if(consultorId && !clienteId){
        return {
          success: true,
          data: conversation,
        };
      }
    } catch (error) {
      this.logger.error('Error retrieving conversation', error);
  
      return {
        success: false,
        message: 'An error occurred while retrieving the conversation.',
      };
    }
  }
  

  /**
   * Lista todas as conversas de um consultor ou cliente.
   */
  async listConversations(userId: string, role: 'consultor' | 'cliente'): Promise<Conversation[]> {
    const query = role === 'consultor' ? { consultorId: userId } : { clienteId: userId };
    return this.conversation.find(query);
  }

  async getRecentMessages(
    consultorId: string,
    clienteId: string,
    limit: number,
  ): Promise<{ success: boolean; data?: Message[]; message?: string }> {
    try {
      const conversation = await this.conversation.findOne({ consultorId, clienteId });
      if (!conversation) {
        return { success: false, message: 'No conversation found.' };
      }
  
      const messages = conversation.messages
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
  
      return { success: true, data: messages.reverse() };
    } catch (error) {
      this.logger.error('Error retrieving recent messages', error);
      return { success: false, message: 'An error occurred while retrieving recent messages.' };
    }
  }
  
  /**
   * Retorna todas as conversas de um consultor específico pelo consultorId.
   * @param consultorId - ID do consultor.
   * @returns Lista de conversas ou uma mensagem de erro.
   */
  async getConversationsByConsultorId(consultorId: string) {
    try {
      const conversations = await this.conversation
        .find({ consultorId })
        .populate('messages') // Popula mensagens se necessário
        .exec();

      return {
        success: true,
        data: conversations,
      };
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      return {
        success: false,
        message: 'Não foi possível recuperar as conversas.',
      };
    }
  }
  
  
}
