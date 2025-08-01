import { supabase } from '../config/supabase.js';
import type { Message, MessageData, ReadReceiptData } from '../types/index.js';

export class MessageService {
  async saveMessage(messageData: MessageData): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          message_id: messageData.messageId,
          chat_id: messageData.chatId,
          sender: messageData.sender,
          content: messageData.content,
          timestamp: messageData.timestamp,
          type: messageData.type,
          reply_to: messageData.replyTo,
          read_by: {},
          edited: false,
          reactions: {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        return null;
      }

      return {
        messageId: data.message_id,
        chatId: data.chat_id,
        sender: data.sender,
        content: data.content,
        timestamp: data.timestamp,
        readBy: data.read_by || {},
        edited: data.edited,
        editedAt: data.edited_at,
        replyTo: data.reply_to,
        reactions: data.reactions || {},
        type: data.type
      } as Message;
    } catch (error) {
      console.error('Error in saveMessage:', error);
      return null;
    }
  }

  async markMessageAsRead(readData: ReadReceiptData): Promise<void> {
    try {
      // Get current read_by data
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('read_by')
        .eq('message_id', readData.messageId)
        .single();

      if (fetchError) {
        console.error('Error fetching message for read receipt:', fetchError);
        return;
      }

      const readBy = message.read_by || {};
      readBy[readData.userId] = readData.timestamp;

      const { error } = await supabase
        .from('messages')
        .update({ read_by: readBy })
        .eq('message_id', readData.messageId);

      if (error) {
        console.error('Error updating read receipt:', error);
      }
    } catch (error) {
      console.error('Error in markMessageAsRead:', error);
    }
  }

  async getChatParticipants(chatId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('participants')
        .eq('chat_id', chatId)
        .single();

      if (error) {
        console.error('Error fetching chat participants:', error);
        return [];
      }

      return data.participants || [];
    } catch (error) {
      console.error('Error in getChatParticipants:', error);
      return [];
    }
  }

  async updateLastMessage(chatId: string, message: Message): Promise<void> {
    try {
      const { error } = await supabase
        .from('chats')
        .update({
          last_message: message,
          updated_at: new Date().toISOString()
        })
        .eq('chat_id', chatId);

      if (error) {
        console.error('Error updating last message:', error);
      }
    } catch (error) {
      console.error('Error in updateLastMessage:', error);
    }
  }
}