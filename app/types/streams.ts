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
  SET_SHOW_MEDIA_PERMISSIONS_MODAL = 'SET_SHOW_MEDIA_PERMISSIONS_MODAL',
  SET_SHOW_MEDIA_PERMISSIONS_DENIED_MODAL = 'SET_SHOW_MEDIA_PERMISSIONS_DENIED_MODAL',
  SET_SHOW_CHANNEL_IS_BUSY_MODAL = 'SET_SHOW_CHANNEL_IS_BUSY_MODAL',
  SET_SHOW_UNEXPECTED_ERROR_MODAL = 'SET_SHOW_UNEXPECTED_ERROR_MODAL',
  SET_CURRENT_ROOM_ID = 'SET_CURRENT_ROOM_ID',
  SET_SHOW_INSUFFICIENT_MINUTES_MODAL = 'SET_SHOW_INSUFFICIENT_MINUTES_MODAL',
  SET_MALE_INITIAL_MINUTES_IN_CALL = 'SET_MALE_INITIAL_MINUTES_IN_CALL',
  ADD_MALE_GIFT_MINUTES_SPENT = 'ADD_MALE_GIFT_MINUTES_SPENT',
  SET_SHOW_MINUTES_EXHAUSTED_MODAL = 'SET_SHOW_MINUTES_EXHAUSTED_MODAL',
  SET_FEMALE_CALL_ENDED_MODAL = 'SET_FEMALE_CALL_ENDED_MODAL',
  SET_FEMALE_CALL_ENDED_INFO = 'SET_FEMALE_CALL_ENDED_INFO',
  ADD_FEMALE_POINTS_EARNED = 'ADD_FEMALE_POINTS_EARNED',
  CHANNEL_HOP_JOIN = 'CHANNEL_HOP_JOIN',
  CHANNEL_HOP_LEAVE = 'CHANNEL_HOP_LEAVE',
  SET_CHANNEL_HOPPING_BLOCKED = 'SET_CHANNEL_HOPPING_BLOCKED',
  RESET_CHANNEL_HOPPING = 'RESET_CHANNEL_HOPPING',
  SET_SHOW_CHANNEL_HOPPING_BLOCKED_MODAL = 'SET_SHOW_CHANNEL_HOPPING_BLOCKED_MODAL',
  SET_CHANNEL_HOPPING_LOADING = 'SET_CHANNEL_HOPPING_LOADING',
}

export interface LoadingStatus {
  message: string;
  isLoading: boolean;
}

export interface FemaleCallSummaryInfo {
  reason:
    | 'Finalizada por ti'
    | 'Usuario finalizó la llamada'
    | 'Saldo agotado'
    | 'Desconexión inesperada';
  duration: string;
  earnings: number | string | null;
  host_id: string | null;
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
  type: 'channel' | 'self' | 'self-gift' | 'channel-gift';
  translatedText?: string;
  gift_image?: string;
}

export interface ChannelHopEntry {
  hostId: string;
  joinTime: number;
  leaveTime?: number;
  duration?: number;
}

export interface ChannelHoppingState {
  entries: ChannelHopEntry[];
  isBlocked: boolean;
  blockStartTime: number | null;
  visitedChannelsInSession: Set<string>;
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
  showMediaPermissionsModal: boolean;
  showMediaPermissionsDeniedModal: boolean;
  showChannelIsBusyModal: boolean;
  showUnexpectedErrorModal: boolean;
  current_room_id: string | null;
  showInsufficientMinutesModal: boolean;
  maleInitialMinutesInCall: number | null;
  maleGiftMinutesSpent: number;
  showMinutesExhaustedModal: boolean;
  showFemaleCallEndedModal: boolean;
  callSummaryInfo: FemaleCallSummaryInfo | null;
  femaleTotalPointsEarnedInCall: number;
  channelHopping: ChannelHoppingState;
  showChannelHoppingBlockedModal: boolean;
  isChannelHoppingLoading: boolean;
}

interface RemoteHostEndedCallAction {
  type: AgoraActionType.REMOTE_HOST_ENDED_CALL;
  payload: { message?: string; ended?: boolean } | null;
}

interface SetShowMinutesExhaustedModalAction {
  type: AgoraActionType.SET_SHOW_MINUTES_EXHAUSTED_MODAL;
  payload: boolean;
}

interface SetShowInsufficientMinutesModalAction {
  type: AgoraActionType.SET_SHOW_INSUFFICIENT_MINUTES_MODAL;
  payload: boolean;
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

interface SetCurrentRoomIdAction {
  type: AgoraActionType.SET_CURRENT_ROOM_ID;
  payload: string | null;
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

interface SetShowMediaPermissionsModalAction {
  type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_MODAL;
  payload: boolean;
}

interface SetShowMediaPermissionsDeniedModalAction {
  type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_DENIED_MODAL;
  payload: boolean;
}

interface SetShowChannelIsBusyModalAction {
  type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL;
  payload: boolean;
}

interface SetShowUnexpectedErrorModalAction {
  type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL;
  payload: boolean;
}

interface SetMaleInitialMinutesInCallAction {
  type: AgoraActionType.SET_MALE_INITIAL_MINUTES_IN_CALL;
  payload: number | null;
}

interface AddMaleGiftMinutesSpentAction {
  type: AgoraActionType.ADD_MALE_GIFT_MINUTES_SPENT;
  payload: number;
}

interface SetFemaleCallEndedModalAction {
  type: AgoraActionType.SET_FEMALE_CALL_ENDED_MODAL;
  payload: boolean;
}

interface SetFemaleCallEndedInfoAction {
  type: AgoraActionType.SET_FEMALE_CALL_ENDED_INFO;
  payload: FemaleCallSummaryInfo | null;
}

interface AddFemalePointsEarnedAction {
  type: AgoraActionType.ADD_FEMALE_POINTS_EARNED;
  payload: number;
}

interface ChannelHopJoinAction {
  type: AgoraActionType.CHANNEL_HOP_JOIN;
  payload: { hostId: string; joinTime: number };
}

interface ChannelHopLeaveAction {
  type: AgoraActionType.CHANNEL_HOP_LEAVE;
  payload: { hostId: string; leaveTime: number };
}

interface SetChannelHoppingBlockedAction {
  type: AgoraActionType.SET_CHANNEL_HOPPING_BLOCKED;
  payload: { isBlocked: boolean; blockStartTime: number | null };
}

interface ResetChannelHoppingAction {
  type: AgoraActionType.RESET_CHANNEL_HOPPING;
}

interface SetShowChannelHoppingBlockedModalAction {
  type: AgoraActionType.SET_SHOW_CHANNEL_HOPPING_BLOCKED_MODAL;
  payload: boolean;
}

interface SetChannelHoppingLoadingAction {
  type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING;
  payload: boolean;
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
  | RemoteHostEndedCallAction
  | SetShowMediaPermissionsModalAction
  | SetShowMediaPermissionsDeniedModalAction
  | SetShowChannelIsBusyModalAction
  | SetShowUnexpectedErrorModalAction
  | SetCurrentRoomIdAction
  | SetShowInsufficientMinutesModalAction
  | SetMaleInitialMinutesInCallAction
  | AddMaleGiftMinutesSpentAction
  | SetShowMinutesExhaustedModalAction
  | SetFemaleCallEndedModalAction
  | SetFemaleCallEndedInfoAction
  | AddFemalePointsEarnedAction
  | ChannelHopJoinAction
  | ChannelHopLeaveAction
  | SetChannelHoppingBlockedAction
  | ResetChannelHoppingAction
  | SetShowChannelHoppingBlockedModalAction
  | SetChannelHoppingLoadingAction;
