export interface ContactNotification {
  fromUserId: string | number;
  fromUserName: string;
  fromUserAvatar?: string;
  toUserId: string | number;
  timestamp: number;
  action: 'added' | 'removed';
}

export interface ContactSuccessInfo {
  toUserId: string | number;
  toUserName: string;
  timestamp: number;
  action: 'added' | 'removed';
}

export interface ContactsState {
  isProcessing: boolean;
  lastNotification: ContactNotification | null;
}

export interface ContactsContextType {
  state: ContactsState;
  sendContactAddedNotification: (
    targetUserId: string | number,
    targetUserName: string,
  ) => Promise<boolean>;
  sendContactRemovedNotification: (
    targetUserId: string | number,
    targetUserName: string,
  ) => Promise<boolean>;
}

export type ContactsAction =
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_LAST_NOTIFICATION'; payload: ContactNotification | null };