import { sortOnlineFemales } from '@/lib/sort-host';
import {
  AgoraAction,
  AgoraActionType,
  AgoraState,
  UserInformation,
} from '../types/streams';

const LOG_PREFIX_REDUCER = '[Reducer]';

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

    case AgoraActionType.SET_TOKENS:
      return {
        ...state,
        tokenRtc: action.payload.tokenRtc,
        tokenRtm: action.payload.tokenRtm,
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
        channelName: null,
        chatMessages: [],
        remoteUsers: [],
        currentCallHostRtcUid: null,
        activeLoadingMessage: action.payload || 'Configurando video y audio...',
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
        channelName: null,
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
        channelName: null,
        currentCallHostRtcUid: null,
        hostEndedCallInfo: null,
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
      console.log(`${LOG_PREFIX_REDUCER} LEAVE_RTM_CALL_CHANNEL`);
      return {
        ...state,
        rtmChannel: null,
        isRtmChannelJoined: false,
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
      console.log(
        `${LOG_PREFIX_REDUCER} ADD_REMOTE_USER, Payload:`,
        JSON.parse(JSON.stringify(action.payload)),
      );
      if (
        !state.remoteUsers.find(
          (user) => String(user.rtcUid) === String(action.payload.rtcUid),
        )
      ) {
        return {
          ...state,
          remoteUsers: [...state.remoteUsers, action.payload],
        };
      }

      return {
        ...state,
        remoteUsers: state.remoteUsers.map((u) =>
          String(u.rtcUid) === String(action.payload.rtcUid)
            ? { ...u, ...action.payload }
            : u,
        ),
      };

    case AgoraActionType.REMOVE_REMOTE_USER:
      return {
        ...state,
        remoteUsers: state.remoteUsers.filter(
          (user) => String(user.rtcUid) !== String(action.payload.rtcUid),
        ),
      };

    case AgoraActionType.UPDATE_REMOTE_USER_TRACK_STATE:
      return {
        ...state,
        remoteUsers: state.remoteUsers.map((user) => {
          if (String(user.rtcUid) === String(action.payload.rtcUid)) {
            return {
              ...user,
              [action.payload.mediaType === 'video'
                ? 'videoTrack'
                : 'audioTrack']: action.payload.isPublishing
                ? action.payload.track
                : null,
              [action.payload.mediaType === 'video' ? 'hasVideo' : 'hasAudio']:
                action.payload.isPublishing,
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
      console.log(
        `${LOG_PREFIX_REDUCER} UPDATE_ONE_FEMALE_IN_LIST, Payload:`,
        JSON.parse(JSON.stringify(updatedFemaleData)),
      );
      let newOnlineFemalesList: UserInformation[];

      if (
        updatedFemaleData.is_active === 0 ||
        updatedFemaleData.status === 'offline'
      ) {
        console.log(
          `${LOG_PREFIX_REDUCER}   ↳ Eliminando female de la lista: ${updatedFemaleData.rtmUid}`,
        );
        newOnlineFemalesList = state.onlineFemalesList.filter(
          (female) =>
            String(female.rtmUid) !== String(updatedFemaleData.rtmUid),
        );
      } else {
        const existingFemaleIndex = state.onlineFemalesList.findIndex(
          (female) =>
            String(female.rtmUid) === String(updatedFemaleData.rtmUid),
        );
        if (existingFemaleIndex > -1) {
          console.log(
            `${LOG_PREFIX_REDUCER}   ↳ Actualizando female existente en la lista: ${updatedFemaleData.rtmUid}`,
          );
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
            console.log(
              `${LOG_PREFIX_REDUCER}   ↳ Añadiendo nueva female a la lista: ${updatedFemaleData.rtmUid}`,
            );
            newOnlineFemalesList = [
              ...state.onlineFemalesList,
              updatedFemaleData,
            ];
          } else {
            console.log(
              `${LOG_PREFIX_REDUCER}   ↳ No se añade nueva female (offline/inactiva): ${updatedFemaleData.rtmUid}`,
            );
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
      console.log(
        `${LOG_PREFIX_REDUCER} SET_CURRENT_CALL_HOST_RTC_UID, Payload:`,
        action.payload,
      );
      return { ...state, currentCallHostRtcUid: action.payload };
    case AgoraActionType.SET_REQUESTING_MEDIA_PERMISSIONS:
      return { ...state, isRequestingMediaPermissions: action.payload };
    case AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE:
      return { ...state, showNoChannelsAvailableModalForMale: action.payload };
    default:
      console.log(
        `${LOG_PREFIX_REDUCER} Acción Desconocida o No Manejada:`,
        (action as any)?.type,
      );
      return state;
  }
}
