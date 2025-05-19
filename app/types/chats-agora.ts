export interface ChatMessage {
  type: 'chat';
  text: string;
  sender_id: string;
  time_stamp: number;
}

export interface TypingSignal {
  type: 'typing';
  is_typing: boolean;
  sender_id: string;
}

export type RTMMessageData = ChatMessage | TypingSignal;
