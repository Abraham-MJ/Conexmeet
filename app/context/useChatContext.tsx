'use client';

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useParams } from 'next/navigation';

import {
  Action,
  ChatContextType,
  MessageContent,
  RtmMessagePayload,
  SendMessageTypes,
  State,
} from '../types/chat';
import { useUser } from './useClientContext';
import { useAgoraContext } from './useAgoraContext';

const initialState: State = {
  conversations: [],
  isLoadingConversations: false,
  conversationsError: null,
  messagesByConversationId: {},
  isLoadingMessages: {},
  messagesError: {},
  user_active: null,
  typingStatusByConversationId: {},
  peerOnlineInChatStatus: {},
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_CONVERSATIONS_START':
      return {
        ...state,
        isLoadingConversations: true,
        conversationsError: null,
      };
    case 'SET_PEER_ONLINE_STATUS':
      return {
        ...state,
        peerOnlineInChatStatus: {
          ...state.peerOnlineInChatStatus,
          [action.payload.conversationId]: action.payload.isOnline,
        },
      };
    case 'FETCH_USER_ACTIVE':
      return {
        ...state,
        user_active: action.payload,
      };
    case 'FETCH_CONVERSATIONS_SUCCESS':
      return {
        ...state,
        isLoadingConversations: false,
        conversations: action.payload,
      };
    case 'FETCH_CONVERSATIONS_FAILURE':
      return {
        ...state,
        isLoadingConversations: false,
        conversationsError: action.payload,
      };
    case 'FETCH_MESSAGES_START':
      return {
        ...state,
        isLoadingMessages: {
          ...state.isLoadingMessages,
          [action.payload.conversationId]: true,
        },
        messagesError: {
          ...state.messagesError,
          [action.payload.conversationId]: null,
        },
      };
    case 'FETCH_MESSAGES_SUCCESS':
      return {
        ...state,
        isLoadingMessages: {
          ...state.isLoadingMessages,
          [action.payload.conversationId]: false,
        },
        messagesByConversationId: {
          ...state.messagesByConversationId,
          [action.payload.conversationId]: action.payload.messages,
        },
      };
    case 'FETCH_MESSAGES_FAILURE':
      return {
        ...state,
        isLoadingMessages: {
          ...state.isLoadingMessages,
          [action.payload.conversationId]: false,
        },
        messagesError: {
          ...state.messagesError,
          [action.payload.conversationId]: action.payload.error,
        },
      };
    case 'ADD_MESSAGE_LOCALLY': {
      const { conversationId, message } = action.payload;
      const currentMessages =
        state.messagesByConversationId[conversationId] || [];
      if (currentMessages.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        ...state,
        messagesByConversationId: {
          ...state.messagesByConversationId,
          [conversationId]: [...currentMessages, message],
        },
      };
    }
    case 'SET_TYPING_STATUS':
      return {
        ...state,
        typingStatusByConversationId: {
          ...state.typingStatusByConversationId,
          [action.payload.conversationId]: action.payload.isTyping,
        },
      };
    default:
      return state;
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const { state: userState } = useUser();
  const { state: agoraState } = useAgoraContext();
  const { rtmClient, isRtmLoggedIn: isLoggedIn } = agoraState;
  const [state, dispatch] = useReducer(reducer, initialState);

  let activeChatId: string | null = null;
  if (params?.chat_id) {
    if (Array.isArray(params.chat_id)) {
      activeChatId = params.chat_id[0] ?? null;
    } else if (typeof params.chat_id === 'string') {
      activeChatId = params.chat_id;
    }
  }

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevChatIdRef = useRef<string | null>(activeChatId);

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight;
      }
    };
    scrollToBottom();
  }, [state.messagesByConversationId, activeChatId]);

  const getUserIdFromChat = useCallback(
    (chatIdParam: string | null | undefined) => {
      if (!chatIdParam) return undefined;
      const conversation = state.conversations.find(
        (item) => String(item.chat_id) === String(chatIdParam),
      );
      return conversation?.user_info.id.toString();
    },
    [state.conversations],
  );

  useEffect(() => {
    const previousChatIdString = prevChatIdRef.current;

    if (previousChatIdString !== activeChatId) {
      const previousUserId = getUserIdFromChat(previousChatIdString);
      if (previousUserId) {
        sendUserInactiveInChatStatus(previousUserId);
      }
    }

    if (activeChatId) {
      loadMessagesForConversation(activeChatId);
      const currentPeerUserId = getUserIdFromChat(activeChatId);
      if (currentPeerUserId) {
        sendUserActiveInChatStatus(currentPeerUserId);
      }
    }

    prevChatIdRef.current = activeChatId;

    return () => {
      const userIdOnCleanup = getUserIdFromChat(activeChatId);
      if (userIdOnCleanup) {
        sendUserInactiveInChatStatus(userIdOnCleanup);
      }
    };
  }, [activeChatId, getUserIdFromChat]);

  useEffect(() => {
    if (rtmClient && isLoggedIn && userState.user?.id) {
      const handleFullMessageFromPeer = (
        rtmSdkMessage: any,
        peerId: string,
      ) => {
        try {
          const payload: RtmMessagePayload = JSON.parse(rtmSdkMessage.text);

          if (payload.senderUid === userState.user.id.toString()) {
            return;
          }

          switch (payload.messageType) {
            case 'CHAT_MESSAGE':
              if (!payload.text || payload.originalId === undefined) {
                return;
              }
              const newMessage: MessageContent = {
                id: Number(payload.originalId),
                text: payload.text,
                sender: 'them',
                time: new Date(payload.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                read: false,
              };
              dispatch({
                type: 'ADD_MESSAGE_LOCALLY',
                payload: {
                  conversationId: payload.room_id
                    ? payload.room_id.toString()
                    : peerId,
                  message: newMessage,
                },
              });
              break;
            case 'TYPING_STARTED':
              dispatch({
                type: 'SET_TYPING_STATUS',
                payload: { conversationId: peerId, isTyping: true },
              });
              break;
            case 'USER_ACTIVE_IN_CHAT': {
              dispatch({
                type: 'SET_PEER_ONLINE_STATUS',
                payload: {
                  conversationId: peerId,
                  isOnline: true,
                },
              });
              break;
            }
            case 'USER_INACTIVE_IN_CHAT': {
              dispatch({
                type: 'SET_PEER_ONLINE_STATUS',
                payload: {
                  conversationId: peerId,
                  isOnline: false,
                },
              });
              break;
            }
            case 'TYPING_STOPPED':
              dispatch({
                type: 'SET_TYPING_STATUS',
                payload: { conversationId: peerId, isTyping: false },
              });
              break;
            default:
              return;
          }
        } catch (e) {}
      };

      rtmClient.on('MessageFromPeer', handleFullMessageFromPeer);

      return () => {
        if (rtmClient) {
          rtmClient.off('MessageFromPeer', handleFullMessageFromPeer);
        }
      };
    }
  }, [rtmClient, isLoggedIn, userState.user?.id, dispatch]);

  const loadChatList = useCallback(async () => {
    if (!userState.user?.id) return;
    dispatch({ type: 'FETCH_CONVERSATIONS_START' });
    try {
      const response = await fetch(
        `/api/chats/get-list-chats?userId=${userState.user.id}`,
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error al cargar la lista de chats.');
      }
      dispatch({ type: 'FETCH_CONVERSATIONS_SUCCESS', payload: result.data });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido.';
      dispatch({ type: 'FETCH_CONVERSATIONS_FAILURE', payload: errorMessage });
    }
  }, [userState.user?.id, dispatch]);

  const loadMessagesForConversation = useCallback(
    async (room_id: string | number) => {
      if (!userState.user?.id || !room_id) return;
      dispatch({
        type: 'FETCH_MESSAGES_START',
        payload: { conversationId: String(room_id) },
      });

      const conversationForUserActive = state.conversations.find(
        (item) => String(item.chat_id) === String(room_id),
      );

      if (conversationForUserActive) {
        dispatch({
          type: 'FETCH_USER_ACTIVE',
          payload: conversationForUserActive,
        });
      }

      try {
        const response = await fetch('/api/chats/get-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_id: String(room_id),
            current_sender_id: userState.user?.id,
          }),
        });
        const data = await response.json();
        if (data.success === true && data.data?.data) {
          dispatch({
            type: 'FETCH_MESSAGES_SUCCESS',
            payload: {
              conversationId: String(room_id),
              messages: data.data.data,
            },
          });
        } else {
          throw new Error(
            data.message || 'Error al cargar mensajes de la conversación.',
          );
        }
      } catch (error: any) {
        dispatch({
          type: 'FETCH_MESSAGES_FAILURE',
          payload: {
            conversationId: String(room_id),
            error: error.message || 'Error desconocido',
          },
        });
      }
    },
    [state.conversations, userState.user?.id, dispatch],
  );

  const sendTypingStarted = useCallback(
    async (peerRtmUid: string) => {
      if (rtmClient && isLoggedIn && userState.user?.id) {
        const payload: RtmMessagePayload = {
          messageType: 'TYPING_STARTED',
          senderUid: userState.user.id.toString(),
          timestamp: new Date().toISOString(),
        };
        try {
          await rtmClient.sendMessageToPeer(
            { text: JSON.stringify(payload) },
            peerRtmUid.toString(),
          );
        } catch (err) {}
      }
    },
    [rtmClient, isLoggedIn, userState.user?.id],
  );

  const sendTypingStopped = useCallback(
    async (peerRtmUid: string) => {
      if (rtmClient && isLoggedIn && userState.user?.id) {
        const payload: RtmMessagePayload = {
          messageType: 'TYPING_STOPPED',
          senderUid: userState.user.id.toString(),
          timestamp: new Date().toISOString(),
        };
        try {
          await rtmClient.sendMessageToPeer(
            { text: JSON.stringify(payload) },
            peerRtmUid.toString(),
          );
        } catch (err) {}
      }
    },
    [rtmClient, isLoggedIn, userState.user?.id],
  );

  const sendUserActiveInChatStatus = useCallback(
    async (peerRtmUid: string) => {
      if (rtmClient && isLoggedIn && userState.user?.id) {
        const payload: RtmMessagePayload = {
          messageType: 'USER_ACTIVE_IN_CHAT',
          senderUid: userState.user.id.toString(),
          timestamp: new Date().toISOString(),
        };
        try {
          await rtmClient.sendMessageToPeer(
            { text: JSON.stringify(payload) },
            peerRtmUid.toString(),
          );
        } catch (err) {}
      }
    },
    [rtmClient, isLoggedIn, userState.user?.id],
  );

  const sendUserInactiveInChatStatus = useCallback(
    async (peerRtmUid: string) => {
      if (rtmClient && isLoggedIn && userState.user?.id) {
        const payload: RtmMessagePayload = {
          messageType: 'USER_INACTIVE_IN_CHAT',
          senderUid: userState.user.id.toString(),
          timestamp: new Date().toISOString(),
        };
        try {
          await rtmClient.sendMessageToPeer(
            { text: JSON.stringify(payload) },
            peerRtmUid.toString(),
          );
        } catch (err) {}
      }
    },
    [rtmClient, isLoggedIn, userState.user?.id],
  );

  const sendMessageRequest = async (paramsMessage: SendMessageTypes) => {
    const { room_id, message, type, user_id: remote_id } = paramsMessage;

    if (!userState.user?.id) throw new Error('User not found');

    const localMessage: MessageContent = {
      id: Date.now() + Math.random(),
      text: message,
      sender: 'me',
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      read: false,
    };

    dispatch({
      type: 'ADD_MESSAGE_LOCALLY',
      payload: { conversationId: String(room_id), message: localMessage },
    });

    if (rtmClient && isLoggedIn) {
      const rtmPayload: RtmMessagePayload = {
        messageType: 'CHAT_MESSAGE',
        text: message,
        originalId: Date.now() + Math.random(),
        senderUid: userState.user.id.toString(),
        timestamp: new Date().toISOString(),
        room_id: String(room_id),
      };

      try {
        await rtmClient.sendMessageToPeer(
          { text: JSON.stringify(rtmPayload) },
          remote_id,
        );
      } catch (rtmSendError) {}
    }

    sendTypingStopped(String(remote_id));

    const bodyForApi: any = {
      user_id: remote_id,
      message: message,
      type: type,
      room_id: String(room_id),
    };

    try {
      const response = await fetch(`/api/chats/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyForApi),
      });
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(
          result.message ||
            'Error desconocido al persistir el mensaje en el backend.',
        );
      }
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const previousChatIdString = prevChatIdRef.current;

    if (previousChatIdString !== activeChatId) {
      const previousUserId = getUserIdFromChat(previousChatIdString);
      if (previousUserId) {
        sendUserInactiveInChatStatus(previousUserId);
      }
    }

    if (activeChatId) {
      loadMessagesForConversation(activeChatId);
      const currentPeerUserId = getUserIdFromChat(activeChatId);
      if (currentPeerUserId) {
        sendUserActiveInChatStatus(currentPeerUserId);
      }
    }

    prevChatIdRef.current = activeChatId;

    return () => {
      const userIdOnCleanup = getUserIdFromChat(activeChatId);
      if (userIdOnCleanup) {
        sendUserInactiveInChatStatus(userIdOnCleanup);
      }
    };
  }, [
    activeChatId,
    getUserIdFromChat,
    loadMessagesForConversation,
    sendUserActiveInChatStatus,
    sendUserInactiveInChatStatus,
  ]);

  const contextValue: ChatContextType = {
    state,
    dispatch,
    loadChatList,
    loadMessagesForConversation,
    sendMessageRequest,
    isLoggedIn,
    sendTypingStarted,
    sendTypingStopped,
    sendUserInactiveInChatStatus,
    sendUserActiveInChatStatus,
    scrollContainerRef,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat debe ser utilizado dentro de un ChatProvider');
  }
  return context;
};
