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
    }
  | {
      type: 'MARK_MY_RECEIVED_MESSAGES_AS_READ_LOCALLY';
      payload: { conversationId: string | number };
    }
  | {
      type: 'MARK_MY_SENT_MESSAGES_AS_READ_BY_PEER_LOCALLY';
      payload: { conversationId: string | number; peerId: string };
    }
  | {
      type: 'SET_UNREAD_COUNT_FOR_CONVERSATION';
      payload: { conversationId: string | number; count: number };
    }
  | {
      type: 'INCREMENT_UNREAD_COUNT';
      payload: { conversationId: string | number };
    }
  | { type: 'RESET_UNREAD_COUNT'; payload: { conversationId: string | number } }
  | {
      type: 'SET_INITIAL_UNREAD_COUNTS';
      payload: Record<string | number, number>;
    }
  | {
      type: 'ADD_NOTIFICATION';
      payload: NotificationPayload;
    }
  | {
      type: 'REMOVE_NOTIFICATION';
      payload: { id: number };
    }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' };

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
  unreadCountByConversationId: Record<string | number, number>;
  totalUnreadCount: number;
  notifications: ChatNotification[];
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
  markMessagesAsRead: (conversationId: string | number) => Promise<void>;
  removeNotification: (notificationId: number) => void;
  clearAllNotifications: () => void;
}

export interface ProcessedChatData {
  chat_id: number;
  user_info: ChatUserExternal;
  unread_messages_count: number;
  last_activity_at: string;
  last_message_content?: string;
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
  translate?: string;
  created_at?: string;
  type?: string;
  file_url?: string;
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
    | 'USER_INACTIVE_IN_CHAT'
    | 'READ_RECEIPT';
  text?: string;
  originalId?: string | number;
  senderUid: string;
  timestamp: string;
  room_id?: string;
  translatedText?: string;
  readUpToMessageId?: string | number;
  type?: string;
  file_url?: string;
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

export interface ChatNotification {
  id: number;
  conversationId: string | number;
  message?: MessageContent;
  senderName: string;
  senderAvatar: string | null;
  type: 'message' | 'typing' | 'system' | 'contact_added' | 'contact_removed';
  timestamp: string;
  contactAction?: 'added' | 'removed';
  userId?: string | number;
}

export interface NotificationPayload {
  conversationId: string | number;
  message?: MessageContent;
  senderName: string;
  senderAvatar: string | null;
  type: 'message' | 'typing' | 'system' | 'contact_added' | 'contact_removed';
  contactAction?: 'added' | 'removed';
  userId?: string | number;
}
