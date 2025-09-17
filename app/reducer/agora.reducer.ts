import { sortOnlineFemales } from '@/lib/sort-host';
import {
  AgoraAction,
  AgoraActionType,
  AgoraState,
  UserInformation,
} from '../types/streams';
import { LOG_PREFIX_REDUCER } from '@/lib/constants';

export const initialState: AgoraState = {
  appID: '927bd867d03e4aa49edd4a4141fe8121',
  tokenRtm: null,
  tokenRtc: null,
  localUser: null,
  remoteUsers: [],
  rtcClient: null,
  localAudioTrack: null,
  localVideoTrack: null,
  rtmClient: null,
  rtmChannel: null,
  channelName: null,
  isRtcJoined: false,
  isLoadingRtc: false,
  rtcError: null,
  isRtmLoggedIn: false,
  isRtmChannelJoined: false,
  isLoadingRtm: false,
  rtmError: null,
  chatMessages: [],
  isLobbyJoined: false,
  lobbyRtmChannel: null,
  onlineFemalesList: [],
  isLoadingOnlineFemales: false,
  onlineFemalesError: null,
  isLocalAudioMuted: false,
  isLocalVideoMuted: false,
  currentCallHostRtcUid: null,
  activeLoadingMessage: null,
  isRequestingMediaPermissions: false,
  showNoChannelsAvailableModalForMale: false,
  hostEndedCallInfo: null,
  showMediaPermissionsModal: false,
  showMediaPermissionsDeniedModal: false,
  showChannelIsBusyModal: false,
  showUnexpectedErrorModal: false,
  current_room_id: null,
  showInsufficientMinutesModal: false,
  maleInitialMinutesInCall: null,
  maleGiftMinutesSpent: 0,
  showMinutesExhaustedModal: false,
  showFemaleCallEndedModal: false,
  callSummaryInfo: null,
  femaleTotalPointsEarnedInCall: 0,
  channelHopping: {
    entries: [],
    isBlocked: false,
    blockStartTime: null,
    visitedChannelsInSession: new Set(),
  },
  showChannelHoppingBlockedModal: false,
  isChannelHoppingLoading: false,
  showMaleRatingModal: false,
  maleRatingInfo: null,
  showFemaleDisconnectedModal: false,
  femaleDisconnectedInfo: null,
};

export function agoraReducer(
  state: AgoraState,
  action: AgoraAction,
): AgoraState {
  switch (action.type) {
    case AgoraActionType.SET_APP_ID:
      return { ...state, appID: action.payload };

    case AgoraActionType.SET_LOCAL_USER_PROFILE:
      return { ...state, localUser: action.payload };

    case AgoraActionType.SET_CURRENT_ROOM_ID:
      return { ...state, current_room_id: action.payload };

    case AgoraActionType.SET_TOKENS:
      return {
        ...state,
        tokenRtc: action.payload.tokenRtc,
        tokenRtm: action.payload.tokenRtm,
      };

    case AgoraActionType.REMOTE_HOST_ENDED_CALL:
      return {
        ...state,
        hostEndedCallInfo: action.payload
          ? {
              ended: action.payload.ended ?? false,
              message: action.payload.message,
            }
          : null,
      };

    case AgoraActionType.RTC_SETUP_START:
      return {
        ...state,
        isLoadingRtc: true,
        rtcError: null,
        isRtcJoined: false,
        rtcClient: null,
        localAudioTrack: null,
        localVideoTrack: null,
        channelName:
          state.localUser?.role === 'female' ? state.channelName : null,
        chatMessages: [],
        remoteUsers: [],
        currentCallHostRtcUid: null,
        activeLoadingMessage: action.payload || 'Configurando video y audio...',
        showMediaPermissionsDeniedModal: false,
        showNoChannelsAvailableModalForMale: false,
        showChannelIsBusyModal: false,
        showUnexpectedErrorModal: false,
        isChannelHoppingLoading: false,
      };

    case AgoraActionType.RTC_SETUP_SUCCESS:
      return {
        ...state,
        isLoadingRtc: false,
        isRtcJoined: true,
        rtcClient: action.payload.rtcClient,
        localAudioTrack: action.payload.localAudioTrack,
        localVideoTrack: action.payload.localVideoTrack,
        channelName: action.payload.channelName,
        rtcError: null,
        activeLoadingMessage: null,
      };

    case AgoraActionType.RTC_SETUP_FAILURE:
      return {
        ...state,
        isLoadingRtc: false,
        isRtcJoined: false,
        rtcError: action.payload,
        rtcClient: null,
        localAudioTrack: null,
        localVideoTrack: null,
        channelName:
          state.localUser?.role === 'female' ? state.channelName : null,
        currentCallHostRtcUid: null,
        activeLoadingMessage: null,
      };

    case AgoraActionType.LEAVE_RTC_CHANNEL:
      return {
        ...state,
        isRtcJoined: false,
        rtcClient: null,
        localAudioTrack: null,
        localVideoTrack: null,
        remoteUsers: [],
        chatMessages: [],
        channelName:
          state.localUser?.role === 'female' ? state.channelName : null,
        currentCallHostRtcUid: null,
        hostEndedCallInfo: null,
        maleInitialMinutesInCall: null,
        maleGiftMinutesSpent: 0,
        showInsufficientMinutesModal: false,
        femaleTotalPointsEarnedInCall: 0,
        isChannelHoppingLoading: false,
      };

    case AgoraActionType.CHANNEL_HOPPING_RTC_LEAVE:
      return {
        ...state,
        isRtcJoined: false,
        rtcClient: null,
        remoteUsers: [],
        chatMessages: [],
        channelName: null,
        currentCallHostRtcUid: null,
      };

    case AgoraActionType.RTM_SETUP_START:
      return {
        ...state,
        isLoadingRtm: true,
        rtmError: null,
        activeLoadingMessage:
          action.payload || 'Conectando servicios en tiempo real...',
      };

    case AgoraActionType.RTM_LOGIN_SUCCESS:
      return {
        ...state,
        isLoadingRtm: false,
        isRtmLoggedIn: true,
        rtmClient: action.payload.rtmClient,
        rtmError: null,
        activeLoadingMessage:
          state.lobbyRtmChannel || state.rtmChannel
            ? state.activeLoadingMessage
            : null,
      };

    case AgoraActionType.RTM_LOGIN_FAILURE:
      return {
        ...state,
        isLoadingRtm: false,
        isRtmLoggedIn: false,
        rtmError: action.payload,
        rtmClient: null,
        rtmChannel: null,
        isRtmChannelJoined: false,
        activeLoadingMessage: null,
      };

    case AgoraActionType.RTM_JOIN_CHANNEL_SUCCESS:
      return {
        ...state,
        isLoadingRtm: false,
        isRtmChannelJoined: true,
        rtmChannel: action.payload.rtmChannel,
        rtmError: null,
      };

    case AgoraActionType.RTM_JOIN_CHANNEL_FAILURE:
      return {
        ...state,
        isLoadingRtm: false,
        isRtmChannelJoined: false,
        rtmError: action.payload,
        rtmChannel: null,
      };

    case AgoraActionType.LEAVE_RTM_CALL_CHANNEL:
      return {
        ...state,
        rtmChannel: null,
        isRtmChannelJoined: false,
        current_room_id: null,
        callSummaryInfo: null,
        femaleTotalPointsEarnedInCall: 0,
      };

    case AgoraActionType.RTM_LOGOUT_LEAVE_CHANNEL:
      return {
        ...state,
        isRtmLoggedIn: false,
        isRtmChannelJoined: false,
        rtmClient: null,
        rtmChannel: null,
        isLobbyJoined: false,
        lobbyRtmChannel: null,
        rtmError: null,
      };

    case AgoraActionType.ADD_REMOTE_USER:
      interface AddRemoteUserAction {
        type: AgoraActionType.ADD_REMOTE_USER;
        payload: UserInformation;
      }

      if (
        !state.remoteUsers.find(
          (user: UserInformation) =>
            String(user.rtcUid) ===
            String((action as AddRemoteUserAction).payload.rtcUid),
        )
      ) {
        return {
          ...state,
          remoteUsers: [
            ...state.remoteUsers,
            (action as AddRemoteUserAction).payload,
          ],
        };
      }

      interface UpdateRemoteUserAction {
        type: AgoraActionType.ADD_REMOTE_USER;
        payload: UserInformation;
      }
      return {
        ...state,
        remoteUsers: state.remoteUsers.map((u: UserInformation) =>
          String(u.rtcUid) ===
          String((action as UpdateRemoteUserAction).payload.rtcUid)
            ? { ...u, ...(action as UpdateRemoteUserAction).payload }
            : u,
        ),
      };

    case AgoraActionType.REMOVE_REMOTE_USER:
      interface RemoveRemoteUserAction {
        type: AgoraActionType.REMOVE_REMOTE_USER;
        payload: { rtcUid: string | number };
      }
      return {
        ...state,
        remoteUsers: state.remoteUsers.filter(
          (user: UserInformation) =>
            String(user.rtcUid) !==
            String((action as RemoveRemoteUserAction).payload.rtcUid),
        ),
      };

    case AgoraActionType.UPDATE_REMOTE_USER_TRACK_STATE:
      interface UpdateRemoteUserTrackStateAction {
        type: AgoraActionType.UPDATE_REMOTE_USER_TRACK_STATE;
        payload: {
          rtcUid: string | number;
          mediaType: 'audio' | 'video';
          isPublishing: boolean;
          track: any;
        };
      }

      return {
        ...state,
        remoteUsers: state.remoteUsers.map((user: UserInformation) => {
          if (
            String(user.rtcUid) ===
            String((action as UpdateRemoteUserTrackStateAction).payload.rtcUid)
          ) {
            return {
              ...user,
              [(action as UpdateRemoteUserTrackStateAction).payload
                .mediaType === 'video'
                ? 'videoTrack'
                : 'audioTrack']: (action as UpdateRemoteUserTrackStateAction)
                .payload.isPublishing
                ? (action as UpdateRemoteUserTrackStateAction).payload.track
                : null,
              [(action as UpdateRemoteUserTrackStateAction).payload
                .mediaType === 'video'
                ? 'hasVideo'
                : 'hasAudio']: (action as UpdateRemoteUserTrackStateAction)
                .payload.isPublishing,
            };
          }
          return user;
        }),
      };

    case AgoraActionType.ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
      };
    case AgoraActionType.CLEAR_CHAT_MESSAGES:
      return { ...state, chatMessages: [] };

    case AgoraActionType.FETCH_ONLINE_FEMALES_START:
      return {
        ...state,
        isLoadingOnlineFemales: true,
        onlineFemalesError: null,
        activeLoadingMessage: null,
      };
    case AgoraActionType.FETCH_ONLINE_FEMALES_SUCCESS:
      const fetchedFemales = action.payload;
      return {
        ...state,
        isLoadingOnlineFemales: false,
        onlineFemalesList: sortOnlineFemales(fetchedFemales),
        onlineFemalesError: null,
      };
    case AgoraActionType.FETCH_ONLINE_FEMALES_FAILURE:
      return {
        ...state,
        isLoadingOnlineFemales: false,
        onlineFemalesError: action.payload,
        onlineFemalesList: [],
      };

    case AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST:
      const updatedFemaleData = action.payload as UserInformation;
      let newOnlineFemalesList: UserInformation[];

      if (
        updatedFemaleData.is_active === 0 ||
        updatedFemaleData.status === 'offline'
      ) {
        newOnlineFemalesList = state.onlineFemalesList.filter(
          (female: UserInformation) =>
            String(female.rtmUid) !== String(updatedFemaleData.rtmUid) &&
            String(female.user_id) !== String(updatedFemaleData.user_id),
        );
      } else {
        const existingFemaleIndex: number = state.onlineFemalesList.findIndex(
          (female: UserInformation) =>
            String(female.rtmUid) === String(updatedFemaleData.rtmUid) ||
            String(female.user_id) === String(updatedFemaleData.user_id),
        );
        if (existingFemaleIndex > -1) {
          const modifiedList = [...state.onlineFemalesList];
          modifiedList[existingFemaleIndex] = {
            ...modifiedList[existingFemaleIndex],
            ...updatedFemaleData,
          };
          newOnlineFemalesList = modifiedList;
        } else {
          if (
            (updatedFemaleData.status === 'online' ||
              updatedFemaleData.status === 'available_call' ||
              updatedFemaleData.status === 'in_call') &&
            (typeof updatedFemaleData.is_active !== 'number' ||
              updatedFemaleData.is_active === 1)
          ) {
            newOnlineFemalesList = [
              ...state.onlineFemalesList,
              updatedFemaleData,
            ];
          } else {
            newOnlineFemalesList = [...state.onlineFemalesList];
          }
        }
      }
      return {
        ...state,
        onlineFemalesList: sortOnlineFemales(newOnlineFemalesList),
      };

    case AgoraActionType.JOIN_LOBBY_START:
      return {
        ...state,
        isLoadingRtm: true,
        isLobbyJoined: false,
        lobbyRtmChannel: null,
        rtmError: null,
        activeLoadingMessage: action.payload || 'Accediendo al lobby...',
      };
    case AgoraActionType.JOIN_LOBBY_SUCCESS:
      return {
        ...state,
        isLoadingRtm: false,
        isLobbyJoined: true,
        lobbyRtmChannel: action.payload.lobbyRtmChannel,
        rtmError: null,
        activeLoadingMessage: null,
      };
    case AgoraActionType.JOIN_LOBBY_FAILURE:
      return {
        ...state,
        isLoadingRtm: false,
        isLobbyJoined: false,
        rtmError: action.payload,
        lobbyRtmChannel: null,
        activeLoadingMessage: null,
      };
    case AgoraActionType.LEAVE_LOBBY:
      return {
        ...state,
        isLobbyJoined: false,
        lobbyRtmChannel: null,
        rtmError: null,
      };

    case AgoraActionType.TOGGLE_LOCAL_AUDIO_MUTE:
      console.warn(
        `${LOG_PREFIX_REDUCER} TOGGLE_LOCAL_AUDIO_MUTE action. Prefiera SET_LOCAL_AUDIO_MUTED.`,
      );
      return { ...state, isLocalAudioMuted: !state.isLocalAudioMuted };
    case AgoraActionType.TOGGLE_LOCAL_VIDEO_MUTE:
      console.warn(
        `${LOG_PREFIX_REDUCER} TOGGLE_LOCAL_VIDEO_MUTE action. Prefiera SET_LOCAL_VIDEO_MUTED.`,
      );
      return { ...state, isLocalVideoMuted: !state.isLocalVideoMuted };
    case AgoraActionType.SET_LOCAL_AUDIO_MUTED:
      return { ...state, isLocalAudioMuted: action.payload };
    case AgoraActionType.SET_LOCAL_VIDEO_MUTED:
      return { ...state, isLocalVideoMuted: action.payload };

    case AgoraActionType.SET_CURRENT_CALL_HOST_RTC_UID:
      return { ...state, currentCallHostRtcUid: action.payload };
    case AgoraActionType.SET_REQUESTING_MEDIA_PERMISSIONS:
      return { ...state, isRequestingMediaPermissions: action.payload };
    case AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE:
      return { ...state, showNoChannelsAvailableModalForMale: action.payload };
    case AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_MODAL:
      return { ...state, showMediaPermissionsModal: action.payload };
    case AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_DENIED_MODAL:
      return { ...state, showMediaPermissionsDeniedModal: action.payload };
    case AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL:
      return { ...state, showChannelIsBusyModal: action.payload };
    case AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL:
      return { ...state, showUnexpectedErrorModal: action.payload };
    case AgoraActionType.SET_SHOW_INSUFFICIENT_MINUTES_MODAL:
      return { ...state, showInsufficientMinutesModal: action.payload };
    case AgoraActionType.SET_MALE_INITIAL_MINUTES_IN_CALL:
      return { ...state, maleInitialMinutesInCall: action.payload };

    case AgoraActionType.ADD_MALE_GIFT_MINUTES_SPENT:
      return {
        ...state,
        maleGiftMinutesSpent: state.maleGiftMinutesSpent + action.payload,
      };
    case AgoraActionType.SET_SHOW_MINUTES_EXHAUSTED_MODAL:
      return { ...state, showMinutesExhaustedModal: action.payload };
    case AgoraActionType.SET_FEMALE_CALL_ENDED_MODAL:
      // Actualizar localStorage cuando cambia el estado del modal
      if (typeof window !== 'undefined') {
        const savedSummary = localStorage.getItem('femaleCallSummary');
        if (savedSummary && action.payload === true) {
          // Si se está abriendo el modal, actualizar el estado en localStorage
          try {
            const parsed = JSON.parse(savedSummary);
            localStorage.setItem('femaleCallSummary', JSON.stringify({
              ...parsed,
              showModal: true
            }));
          } catch (error) {
            console.error('[AgoraReducer] Error actualizando localStorage:', error);
          }
        }
        // No limpiar localStorage cuando se cierra el modal, 
        // se limpiará desde closeFemaleCallEndedSummaryModal después del delay
      }
      
      return { ...state, showFemaleCallEndedModal: action.payload };

    case AgoraActionType.SET_FEMALE_CALL_ENDED_INFO:
      // Persistir en localStorage si hay datos
      if (typeof window !== 'undefined') {
        if (action.payload) {
          const persistData = {
            callSummaryInfo: action.payload,
            showModal: true,
            timestamp: Date.now()
          };
          localStorage.setItem('femaleCallSummary', JSON.stringify(persistData));
        }
      }
      
      return { ...state, callSummaryInfo: action.payload };
    case AgoraActionType.ADD_FEMALE_POINTS_EARNED:
      return {
        ...state,
        femaleTotalPointsEarnedInCall:
          state.femaleTotalPointsEarnedInCall + action.payload,
      };

    case AgoraActionType.CHANNEL_HOP_JOIN:
      const newEntry = {
        hostId: action.payload.hostId,
        joinTime: action.payload.joinTime,
      };
      return {
        ...state,
        channelHopping: {
          ...state.channelHopping,
          entries: [...state.channelHopping.entries, newEntry],
          visitedChannelsInSession: new Set([
            ...state.channelHopping.visitedChannelsInSession,
            action.payload.hostId,
          ]),
        },
      };

    case AgoraActionType.CHANNEL_HOP_LEAVE:
      const updatedEntries = state.channelHopping.entries.map((entry) =>
        entry.hostId === action.payload.hostId && !entry.leaveTime
          ? {
              ...entry,
              leaveTime: action.payload.leaveTime,
              duration: Math.floor(
                (action.payload.leaveTime - entry.joinTime) / 1000,
              ),
            }
          : entry,
      );
      return {
        ...state,
        channelHopping: {
          ...state.channelHopping,
          entries: updatedEntries,
        },
      };

    case AgoraActionType.SET_CHANNEL_HOPPING_BLOCKED:
      return {
        ...state,
        channelHopping: {
          ...state.channelHopping,
          isBlocked: action.payload.isBlocked,
          blockStartTime: action.payload.blockStartTime,
        },
      };

    case AgoraActionType.RESET_CHANNEL_HOPPING:
      return {
        ...state,
        channelHopping: {
          entries: [],
          isBlocked: false,
          blockStartTime: null,
          visitedChannelsInSession: new Set(),
        },
        isChannelHoppingLoading: false,
      };

    case AgoraActionType.SET_SHOW_CHANNEL_HOPPING_BLOCKED_MODAL:
      return {
        ...state,
        showChannelHoppingBlockedModal: action.payload,
      };

    case AgoraActionType.SET_CHANNEL_HOPPING_LOADING:
      return {
        ...state,
        isChannelHoppingLoading: action.payload,
      };

    case AgoraActionType.SET_SHOW_MALE_RATING_MODAL:
      return {
        ...state,
        showMaleRatingModal: action.payload.show,
        maleRatingInfo: action.payload.femaleInfo || null,
      };

    case AgoraActionType.SET_SHOW_FEMALE_DISCONNECTED_MODAL:
      return {
        ...state,
        showFemaleDisconnectedModal: action.payload.show,
        femaleDisconnectedInfo: action.payload.femaleInfo || null,
      };

    default:
      return state;
  }
}
