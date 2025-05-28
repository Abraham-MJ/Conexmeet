import {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng';
import { RtmChannel, RtmClient } from 'agora-rtm-sdk';

export enum AgoraActionType {
  SET_APP_ID = 'SET_APP_ID',
  SET_LOCAL_USER_PROFILE = 'SET_LOCAL_USER_PROFILE',
  SET_TOKENS = 'SET_TOKENS',
  RTC_SETUP_START = 'RTC_SETUP_START',
  RTC_SETUP_SUCCESS = 'RTC_SETUP_SUCCESS',
  RTC_SETUP_FAILURE = 'RTC_SETUP_FAILURE',
  LEAVE_RTC_CHANNEL = 'LEAVE_RTC_CHANNEL',
  RTM_SETUP_START = 'RTM_SETUP_START',
  RTM_LOGIN_SUCCESS = 'RTM_LOGIN_SUCCESS',
  RTM_LOGIN_FAILURE = 'RTM_LOGIN_FAILURE',
  RTM_JOIN_CHANNEL_SUCCESS = 'RTM_JOIN_CHANNEL_SUCCESS',
  RTM_JOIN_CHANNEL_FAILURE = 'RTM_JOIN_CHANNEL_FAILURE',
  LEAVE_RTM_CALL_CHANNEL = 'LEAVE_RTM_CALL_CHANNEL',
  RTM_LOGOUT_LEAVE_CHANNEL = 'RTM_LOGOUT_LEAVE_CHANNEL',
  ADD_REMOTE_USER = 'ADD_REMOTE_USER',
  REMOVE_REMOTE_USER = 'REMOVE_REMOTE_USER',
  UPDATE_REMOTE_USER_TRACK_STATE = 'UPDATE_REMOTE_USER_TRACK_STATE',
  UPDATE_REMOTE_USER_PROFILE_INFO = 'UPDATE_REMOTE_USER_PROFILE_INFO',
  ADD_CHAT_MESSAGE = 'ADD_CHAT_MESSAGE',
  CLEAR_CHAT_MESSAGES = 'CLEAR_CHAT_MESSAGES',
  FETCH_ONLINE_FEMALES_START = 'FETCH_ONLINE_FEMALES_START',
  FETCH_ONLINE_FEMALES_SUCCESS = 'FETCH_ONLINE_FEMALES_SUCCESS',
  FETCH_ONLINE_FEMALES_FAILURE = 'FETCH_ONLINE_FEMALES_FAILURE',
  UPDATE_ONE_FEMALE_IN_LIST = 'UPDATE_ONE_FEMALE_IN_LIST',
  JOIN_LOBBY_START = 'JOIN_LOBBY_START',
  JOIN_LOBBY_SUCCESS = 'JOIN_LOBBY_SUCCESS',
  JOIN_LOBBY_FAILURE = 'JOIN_LOBBY_FAILURE',
  LEAVE_LOBBY = 'LEAVE_LOBBY',
  TOGGLE_LOCAL_AUDIO_MUTE = 'TOGGLE_LOCAL_AUDIO_MUTE',
  TOGGLE_LOCAL_VIDEO_MUTE = 'TOGGLE_LOCAL_VIDEO_MUTE',
  SET_LOCAL_AUDIO_MUTED = 'SET_LOCAL_AUDIO_MUTED',
  SET_LOCAL_VIDEO_MUTED = 'SET_LOCAL_VIDEO_MUTED',
  SET_CURRENT_CALL_HOST_RTC_UID = 'SET_CURRENT_CALL_HOST_RTC_UID',
  SET_REQUESTING_MEDIA_PERMISSIONS = 'SET_REQUESTING_MEDIA_PERMISSIONS',
  SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE = 'SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE',
  REMOTE_HOST_ENDED_CALL = 'REMOTE_HOST_ENDED_CALL',
}

export interface LoadingStatus {
  message: string;
  isLoading: boolean;
}

export interface UserInformation {
  user_id: string | number;
  user_name?: string;
  avatar?: string;
  role?: 'female' | 'male' | 'admin';
  videoTrack?: IRemoteVideoTrack | ICameraVideoTrack | null;
  audioTrack?: IRemoteAudioTrack | IMicrophoneAudioTrack | null;
  hasVideo?: boolean;
  hasAudio?: boolean;
  rtcUid: string | number;
  rtmUid: string | number;
  is_active?: 0 | 1;
  in_call?: 0 | 1;
  host_id?: string | null;
  status?: 'online' | 'available_call' | 'in_call' | 'offline';
}

export interface ChatMessage {
  rtmUid: string;
  user_name?: string;
  text: string;
  timestamp: number;
  type: 'channel' | 'self';
}

export interface AgoraState {
  appID: string;
  tokenRtm: string | null;
  tokenRtc: string | null;
  localUser: UserInformation | null;
  remoteUsers: UserInformation[];
  rtcClient: IAgoraRTCClient | null;
  localAudioTrack: IMicrophoneAudioTrack | null;
  localVideoTrack: ICameraVideoTrack | null;
  rtmClient: RtmClient | null;
  rtmChannel: RtmChannel | null;
  channelName: string | null;
  isRtcJoined: boolean;
  isLoadingRtc: boolean;
  rtcError: string | null;
  isRtmLoggedIn: boolean;
  isRtmChannelJoined: boolean;
  isLoadingRtm: boolean;
  rtmError: string | null;
  chatMessages: ChatMessage[];
  isLobbyJoined: boolean;
  lobbyRtmChannel: RtmChannel | null;
  onlineFemalesList: UserInformation[];
  isLoadingOnlineFemales: boolean;
  onlineFemalesError: string | null;
  isLocalAudioMuted: boolean;
  isLocalVideoMuted: boolean;
  currentCallHostRtcUid: string | number | null;
  activeLoadingMessage: string | null;
  isRequestingMediaPermissions: boolean;
  showNoChannelsAvailableModalForMale: boolean;
  hostEndedCallInfo: { ended: boolean; message?: string } | null;
}

interface RemoteHostEndedCallAction {
  type: AgoraActionType.REMOTE_HOST_ENDED_CALL;
  payload?: { message?: string };
}

interface SetAppIdAction {
  type: AgoraActionType.SET_APP_ID;
  payload: string;
}

interface SetLocalUserProfileAction {
  type: AgoraActionType.SET_LOCAL_USER_PROFILE;
  payload: UserInformation | null;
}

interface SetTokensAction {
  type: AgoraActionType.SET_TOKENS;
  payload: { tokenRtc: string | null; tokenRtm: string | null };
}

interface RtcSetupStartAction {
  type: AgoraActionType.RTC_SETUP_START;
  payload?: string;
}

interface SetShowNoChannelsAvailableModalForMaleAction {
  type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE;
  payload: boolean;
}

interface SetRequestingMediaPermissionsAction {
  type: AgoraActionType.SET_REQUESTING_MEDIA_PERMISSIONS;
  payload: boolean;
}

interface RtcSetupSuccessAction {
  type: AgoraActionType.RTC_SETUP_SUCCESS;
  payload: {
    rtcClient: IAgoraRTCClient;
    localAudioTrack: IMicrophoneAudioTrack | null;
    localVideoTrack: ICameraVideoTrack | null;
    channelName: string;
  };
}

interface RtcSetupFailureAction {
  type: AgoraActionType.RTC_SETUP_FAILURE;
  payload: string;
}

interface LeaveRtcChannelAction {
  type: AgoraActionType.LEAVE_RTC_CHANNEL;
}

interface RtmSetupStartAction {
  type: AgoraActionType.RTM_SETUP_START;
  payload?: string;
}

interface RtmLoginSuccessAction {
  type: AgoraActionType.RTM_LOGIN_SUCCESS;
  payload: { rtmClient: RtmClient };
}

interface RtmLoginFailureAction {
  type: AgoraActionType.RTM_LOGIN_FAILURE;
  payload: string;
}

interface RtmJoinChannelSuccessAction {
  type: AgoraActionType.RTM_JOIN_CHANNEL_SUCCESS;
  payload: { rtmChannel: RtmChannel };
}

interface RtmJoinChannelFailureAction {
  type: AgoraActionType.RTM_JOIN_CHANNEL_FAILURE;
  payload: string;
}

interface LeaveRtmCallChannelAction {
  type: AgoraActionType.LEAVE_RTM_CALL_CHANNEL;
}

interface RtmLogoutLeaveChannelAction {
  type: AgoraActionType.RTM_LOGOUT_LEAVE_CHANNEL;
}

interface AddRemoteUserAction {
  type: AgoraActionType.ADD_REMOTE_USER;
  payload: UserInformation;
}

interface RemoveRemoteUserAction {
  type: AgoraActionType.REMOVE_REMOTE_USER;
  payload: { rtcUid: string };
}

interface UpdateRemoteUserTrackStateAction {
  type: AgoraActionType.UPDATE_REMOTE_USER_TRACK_STATE;
  payload: {
    rtcUid: string;
    mediaType: 'audio' | 'video';
    isPublishing: boolean;
    track?: IRemoteAudioTrack | IRemoteVideoTrack;
  };
}

interface UpdateRemoteUserProfileInfoAction {
  type: AgoraActionType.UPDATE_REMOTE_USER_PROFILE_INFO;
  payload: {
    rtcUid: string;
    rtmUid?: string;
    user_id?: string | number;
    user_name?: string;
    avatar?: string;
    role?: 'female' | 'male' | 'admin';
  };
}

interface AddChatMessageAction {
  type: AgoraActionType.ADD_CHAT_MESSAGE;
  payload: ChatMessage;
}

interface ClearChatMessagesAction {
  type: AgoraActionType.CLEAR_CHAT_MESSAGES;
}

interface FetchOnlineFemalesStartAction {
  type: AgoraActionType.FETCH_ONLINE_FEMALES_START;
  payload?: string;
}

interface FetchOnlineFemalesSuccessAction {
  type: AgoraActionType.FETCH_ONLINE_FEMALES_SUCCESS;
  payload: UserInformation[];
}

interface FetchOnlineFemalesFailureAction {
  type: AgoraActionType.FETCH_ONLINE_FEMALES_FAILURE;
  payload: string;
}

interface UpdateOneFemaleInListAction {
  type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST;
  payload: UserInformation;
}

interface JoinLobbyStartAction {
  type: AgoraActionType.JOIN_LOBBY_START;
  payload?: string;
}

interface JoinLobbySuccessAction {
  type: AgoraActionType.JOIN_LOBBY_SUCCESS;
  payload: { lobbyRtmChannel: RtmChannel };
}

interface JoinLobbyFailureAction {
  type: AgoraActionType.JOIN_LOBBY_FAILURE;
  payload: string;
}

interface LeaveLobbyAction {
  type: AgoraActionType.LEAVE_LOBBY;
}

interface ToggleLocalAudioMuteAction {
  type: AgoraActionType.TOGGLE_LOCAL_AUDIO_MUTE;
}

interface ToggleLocalVideoMuteAction {
  type: AgoraActionType.TOGGLE_LOCAL_VIDEO_MUTE;
}

interface SetLocalAudioMutedAction {
  type: AgoraActionType.SET_LOCAL_AUDIO_MUTED;
  payload: boolean;
}

interface SetLocalVideoMutedAction {
  type: AgoraActionType.SET_LOCAL_VIDEO_MUTED;
  payload: boolean;
}
interface SetCurrentCallHostRtcUidAction {
  type: AgoraActionType.SET_CURRENT_CALL_HOST_RTC_UID;
  payload: string | number | null;
}

export type AgoraAction =
  | SetAppIdAction
  | SetLocalUserProfileAction
  | SetTokensAction
  | RtcSetupStartAction
  | RtcSetupSuccessAction
  | RtcSetupFailureAction
  | LeaveRtcChannelAction
  | RtmSetupStartAction
  | RtmLoginSuccessAction
  | RtmLoginFailureAction
  | RtmJoinChannelSuccessAction
  | RtmJoinChannelFailureAction
  | LeaveRtmCallChannelAction
  | RtmLogoutLeaveChannelAction
  | AddRemoteUserAction
  | RemoveRemoteUserAction
  | UpdateRemoteUserTrackStateAction
  | UpdateRemoteUserProfileInfoAction
  | AddChatMessageAction
  | ClearChatMessagesAction
  | FetchOnlineFemalesStartAction
  | FetchOnlineFemalesSuccessAction
  | FetchOnlineFemalesFailureAction
  | UpdateOneFemaleInListAction
  | JoinLobbyStartAction
  | JoinLobbySuccessAction
  | JoinLobbyFailureAction
  | LeaveLobbyAction
  | ToggleLocalAudioMuteAction
  | ToggleLocalVideoMuteAction
  | SetLocalAudioMutedAction
  | SetLocalVideoMutedAction
  | SetCurrentCallHostRtcUidAction
  | SetRequestingMediaPermissionsAction
  | SetShowNoChannelsAvailableModalForMaleAction
  | RemoteHostEndedCallAction;
