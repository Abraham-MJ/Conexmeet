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
  ProcessedChatData,
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
  unreadCountByConversationId: {},
  totalUnreadCount: 0,
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function reducer(state: State, action: Action): State {
  let newUnreadCountByConversationId: Record<string | number, number>;
  let newTotalUnreadCount: number;

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
    case 'MARK_MY_RECEIVED_MESSAGES_AS_READ_LOCALLY': {
      const { conversationId } = action.payload;
      const currentMessages =
        state.messagesByConversationId[conversationId] || [];

      const updatedMessages = currentMessages.map((msg) => {
        if (msg.sender === 'them' && !msg.read) {
          return { ...msg, read: true };
        }
        return msg;
      });

      return {
        ...state,
        messagesByConversationId: {
          ...state.messagesByConversationId,
          [conversationId]: updatedMessages,
        },
      };
    }
    case 'MARK_MY_SENT_MESSAGES_AS_READ_BY_PEER_LOCALLY': {
      const { conversationId } = action.payload;
      const currentMessages =
        state.messagesByConversationId[conversationId] || [];

      const updatedMessages = currentMessages.map((msg) => {
        if (msg.sender === 'me' && !msg.read) {
          return { ...msg, read: true };
        }
        return msg;
      });

      return {
        ...state,
        messagesByConversationId: {
          ...state.messagesByConversationId,
          [conversationId]: updatedMessages,
        },
      };
    }
    case 'SET_INITIAL_UNREAD_COUNTS':
      newUnreadCountByConversationId = { ...action.payload };
      newTotalUnreadCount = Object.values(
        newUnreadCountByConversationId,
      ).reduce((sum, count) => sum + count, 0);
      return {
        ...state,
        unreadCountByConversationId: newUnreadCountByConversationId,
        totalUnreadCount: newTotalUnreadCount,
      };

    case 'SET_UNREAD_COUNT_FOR_CONVERSATION':
      newUnreadCountByConversationId = {
        ...state.unreadCountByConversationId,
        [action.payload.conversationId]: action.payload.count,
      };
      newTotalUnreadCount = Object.values(
        newUnreadCountByConversationId,
      ).reduce((sum, count) => sum + count, 0);
      return {
        ...state,
        unreadCountByConversationId: newUnreadCountByConversationId,
        totalUnreadCount: newTotalUnreadCount,
      };

    case 'INCREMENT_UNREAD_COUNT': {
      const currentCount =
        state.unreadCountByConversationId[action.payload.conversationId] || 0;
      newUnreadCountByConversationId = {
        ...state.unreadCountByConversationId,
        [action.payload.conversationId]: currentCount + 1,
      };
      newTotalUnreadCount = state.totalUnreadCount + 1;
      return {
        ...state,
        unreadCountByConversationId: newUnreadCountByConversationId,
        totalUnreadCount: newTotalUnreadCount,
      };
    }

    case 'RESET_UNREAD_COUNT': {
      const currentCount =
        state.unreadCountByConversationId[action.payload.conversationId] || 0;
      newUnreadCountByConversationId = {
        ...state.unreadCountByConversationId,
        [action.payload.conversationId]: 0,
      };
      newTotalUnreadCount = state.totalUnreadCount - currentCount;
      if (newTotalUnreadCount < 0) newTotalUnreadCount = 0;
      return {
        ...state,
        unreadCountByConversationId: newUnreadCountByConversationId,
        totalUnreadCount: newTotalUnreadCount,
      };
    }
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

  const markedChatsRef = useRef<Set<string | number>>(new Set());

  let activeChatId: string | null = null;
  if (params?.chat_id) {
    if (Array.isArray(params.chat_id)) {
      activeChatId = params.chat_id[0] ?? null;
    } else if (typeof params.chat_id === 'string') {
      activeChatId = params.chat_id;
    }
  }

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
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
                translate: payload.translatedText,
                sender: 'them',
                time: new Date(payload.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                read: false,
                created_at: payload.timestamp,
                file_url: payload.file_url,
                type: payload.type,
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

              const messageConvId = payload.room_id
                ? payload.room_id.toString()
                : peerId;
              if (messageConvId !== activeChatId) {
                dispatch({
                  type: 'INCREMENT_UNREAD_COUNT',
                  payload: { conversationId: messageConvId },
                });
              }
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
            case 'READ_RECEIPT': {
              const { room_id, senderUid } = payload;
              const conversationId = room_id ? room_id.toString() : senderUid;
              dispatch({
                type: 'MARK_MY_SENT_MESSAGES_AS_READ_BY_PEER_LOCALLY',
                payload: {
                  conversationId: conversationId,
                  peerId: senderUid,
                },
              });
              break;
            }
            default:
              return;
          }
        } catch (e) {
          console.error('Error parsing RTM message payload:', e);
        }
      };

      rtmClient.on('MessageFromPeer', handleFullMessageFromPeer);

      return () => {
        if (rtmClient) {
          rtmClient.off('MessageFromPeer', handleFullMessageFromPeer);
        }
      };
    }
  }, [rtmClient, isLoggedIn, userState.user?.id, dispatch, activeChatId]);

  const markMessagesAsRead = useCallback(
    async (conversationId: string | number) => {
      if (!userState.user?.id) return;
      const convIdStr = String(conversationId);

      const messagesInActiveChat =
        state.messagesByConversationId[conversationId];

      if (!messagesInActiveChat) {
        return;
      }

      const unreadMessagesFromPeer = messagesInActiveChat.filter(
        (msg) => msg.sender === 'them' && !msg.read,
      );

      if (unreadMessagesFromPeer.length === 0) {
        if (!markedChatsRef.current.has(convIdStr)) {
          markedChatsRef.current.add(convIdStr);
        } else {
        }
        return;
      }

      markedChatsRef.current.delete(convIdStr);

      const latestUnreadMessageId = Math.max(
        ...unreadMessagesFromPeer.map((msg) => Number(msg.id)),
      );

      try {
        const response = await fetch('/api/chats/read-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: convIdStr,
            message_ids: [latestUnreadMessageId],
          }),
        });
        const result = await response.json();

        if (response.ok && result.success) {
          markedChatsRef.current.add(convIdStr);

          dispatch({
            type: 'MARK_MY_RECEIVED_MESSAGES_AS_READ_LOCALLY',
            payload: { conversationId: convIdStr },
          });

          dispatch({
            type: 'RESET_UNREAD_COUNT',
            payload: { conversationId: convIdStr },
          });

          if (rtmClient && isLoggedIn && userState.user?.id) {
            const peerRtmUid = getUserIdFromChat(convIdStr);
            if (peerRtmUid) {
              const payload: RtmMessagePayload = {
                messageType: 'READ_RECEIPT',
                senderUid: userState.user.id.toString(),
                timestamp: new Date().toISOString(),
                room_id: convIdStr,
                readUpToMessageId: latestUnreadMessageId,
              };
              try {
                await rtmClient.sendMessageToPeer(
                  { text: JSON.stringify(payload) },
                  peerRtmUid.toString(),
                );
              } catch (rtmSendError) {
                console.error(
                  'markMessagesAsRead: Error sending READ_RECEIPT by RTM:',
                  rtmSendError,
                );
              }
            }
          }
        } else {
          console.error(
            `markMessagesAsRead: Error marking messages as read in backend:`,
            result.message || 'Error desconocido',
          );
        }
      } catch (error) {
        console.error(
          'markMessagesAsRead: Error calling API to mark messages as read:',
          error,
        );
      }
    },
    [
      rtmClient,
      isLoggedIn,
      userState.user?.id,
      state.messagesByConversationId,
      getUserIdFromChat,
      dispatch,
      markedChatsRef,
    ],
  );

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

      const initialUnreadCounts: Record<string | number, number> = {};
      result.data.forEach((chat: ProcessedChatData) => {
        initialUnreadCounts[chat.chat_id] = chat.unread_messages_count;
      });

      dispatch({
        type: 'SET_INITIAL_UNREAD_COUNTS',
        payload: initialUnreadCounts,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido.';
      console.error(
        'loadChatList: Error fetching conversations:',
        errorMessage,
      );
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
        console.error(
          'loadMessagesForConversation: Error fetching messages:',
          error,
        );
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

        await rtmClient.sendMessageToPeer(
          { text: JSON.stringify(payload) },
          peerRtmUid.toString(),
        );
      }
    },
    [rtmClient, isLoggedIn, userState.user?.id],
  );

  const sendMessageRequest = async (paramsMessage: SendMessageTypes) => {
    const { room_id, message, type, user_id: remote_id, file } = paramsMessage;

    if (!userState.user?.id) throw new Error('User not found');

    let originalText = message;
    let translatedText: string | undefined = undefined;

    try {
      const translateResponse = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
      const translateResult = await translateResponse.json();

      if (translateResponse.ok && translateResult.translatedText) {
        translatedText = translateResult.translatedText;
      } else {
        console.warn('Translation failed:', translateResult.error);
      }
    } catch (error) {
      console.error('Error calling translation API:', error);
    }

    sendTypingStopped(String(remote_id));

    const formData = new FormData();
    formData.append('user_id', remote_id);
    formData.append('body', originalText);
    formData.append('body_traslate', translatedText ?? '');
    formData.append('type', type);

    if (file instanceof File) {
      formData.append('file', file);
    }

    try {
      const response = await fetch(
        `https://app.conexmeet.live/api/v1/send-message/${room_id}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${userState.user.token}`,
            'Cache-Control': 'no-cache',
          },
          body: formData,
        },
      );

      const data = await response.json();

      const localMessage: MessageContent = {
        id: Date.now() + Math.random(),
        text: originalText,
        translate: translatedText,
        sender: 'me',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        created_at: new Date().toISOString(),
        read: false,
        file_url: data.data.file_url,
        type: data.data.type,
      };

      dispatch({
        type: 'ADD_MESSAGE_LOCALLY',
        payload: { conversationId: String(room_id), message: localMessage },
      });

      if (rtmClient && isLoggedIn) {
        const rtmPayload: RtmMessagePayload = {
          messageType: 'CHAT_MESSAGE',
          text: originalText,
          translatedText: translatedText,
          originalId: Date.now() + Math.random(),
          senderUid: userState.user.id.toString(),
          timestamp: new Date().toISOString(),
          room_id: String(room_id),
          file_url: data.data.file_url,
          type: data.data.type,
        };
        await rtmClient.sendMessageToPeer(
          { text: JSON.stringify(rtmPayload) },
          remote_id,
        );
      }
    } catch (error) {
      console.error(
        'Error en la conexión o procesamiento de la solicitud directa:',
        error,
      );
      return Promise.reject({
        success: false,
        message:
          'Error de red o interno del cliente al contactar la API externa.',
        error:
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : String(error),
      });
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

  useEffect(() => {
    if (prevChatIdRef.current && prevChatIdRef.current !== activeChatId) {
      markedChatsRef.current.delete(prevChatIdRef.current);
    }
  }, [activeChatId]);

  useEffect(() => {
    if (activeChatId && state.messagesByConversationId[activeChatId]) {
      const timer = setTimeout(() => {
        markMessagesAsRead(activeChatId);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [activeChatId, state.messagesByConversationId, markMessagesAsRead]);

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
    markMessagesAsRead,
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
