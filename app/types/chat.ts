export type Action =
  | { type: 'FETCH_CONVERSATIONS_START' }
  | { type: 'FETCH_CONVERSATIONS_SUCCESS'; payload: ProcessedChatData[] }
  | { type: 'FETCH_USER_ACTIVE'; payload: ProcessedChatData | null }
  | { type: 'FETCH_CONVERSATIONS_FAILURE'; payload: string }
  | {
      type: 'FETCH_MESSAGES_START';
      payload: { conversationId: string | number };
    }
  | {
      type: 'FETCH_MESSAGES_SUCCESS';
      payload: { conversationId: string | number; messages: MessageContent[] };
    }
  | {
      type: 'FETCH_MESSAGES_FAILURE';
      payload: { conversationId: string | number; error: string };
    }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: string | number | null }
  | {
      type: 'ADD_MESSAGE_LOCALLY';
      payload: { conversationId: string | number; message: MessageContent };
    }
  | {
      type: 'SET_TYPING_STATUS';
      payload: { conversationId: string | number; isTyping: boolean };
    }
  | {
      type: 'SET_PEER_ONLINE_STATUS';
      payload: { conversationId: string | number; isOnline: boolean };
    };

export interface State {
  conversations: ProcessedChatData[];
  user_active: ProcessedChatData | null;
  isLoadingConversations: boolean;
  conversationsError: string | null;
  messagesByConversationId: Record<string | number, MessageContent[]>;
  isLoadingMessages: Record<string | number, boolean>;
  messagesError: Record<string | number, string | null>;
  typingStatusByConversationId: Record<string | number, boolean>;
  peerOnlineInChatStatus: Record<string | number, boolean>;
}

export interface ChatContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
  loadChatList: () => Promise<void>;
  loadMessagesForConversation: (
    conversationId: string | number,
  ) => Promise<void>;
  sendMessageRequest: (data: SendMessageTypes) => Promise<any>;
  isLoggedIn?: boolean;
  sendTypingStarted: (peerRtmUid: string) => void;
  sendTypingStopped: (peerRtmUid: string) => void;
  sendUserInactiveInChatStatus: (peerRtmUid: string) => void;
  sendUserActiveInChatStatus: (peerRtmUid: string) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export interface ProcessedChatData {
  chat_id: number;
  user_info: ChatUserExternal;
  unread_messages_count: number;
  last_activity_at: string;
}

export interface ChatUserExternal {
  email: string;
  id: number;
  name: string;
  profile_photo_path: string | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  receiver_id: number;
  read_at: string | null;
  body: string;
  body_traslate?: string;
  type: string;
  color?: string;
  created_at: string;
  updated_at: string;
  senderName?: string;
  receiverName?: string;
}

export interface Conversation {
  id: number;
  conversation_id: number;
  sender_id: number;
  receiver_id: number;
  read_at: string | null;
  body: string;
  body_traslate?: string;
  type: string;
  color?: string;
  created_at: string;
  updated_at: string;
  sender: string;
  receiver: string;
}

export interface MessageContent {
  id: number;
  text: string;
  sender: 'me' | 'them';
  time: string;
  read?: boolean;
  room_id?: string;
}

export interface SendMessageTypes {
  room_id: string;
  user_id: string;
  message: string;
  file: File | null;
  translate: string | null;
  type: string;
}

export interface RtmMessagePayload {
  messageType:
    | 'CHAT_MESSAGE'
    | 'TYPING_STARTED'
    | 'TYPING_STOPPED'
    | 'USER_ACTIVE_IN_CHAT'
    | 'USER_INACTIVE_IN_CHAT';
  text?: string;
  originalId?: string | number;
  senderUid: string;
  timestamp: string;
  room_id?: string;
}

export interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
}

export interface SendMessageProps {
  file: File | null;
  message: string;
  room_id: string;
  translate: string;
  type: string;
  user_id: string;
}

export interface WhriteMessageProps {
  onSendMessage: (messageData: SendMessageProps) => void;
  remote_id: string;
  sendTypingStarted: (peerRtmUid: string) => void;
  sendTypingStopped: (peerRtmUid: string) => void;
  isMobile?: boolean;
  isRtmLoggedIn?: boolean;
}
