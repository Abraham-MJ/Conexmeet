export type MediaType = 'video' | 'image' | 'audio' | 'text';
export type HistoryStatus = 0 | 1 | 2;

export interface User {
  id: number;
  name: string;
  email: string;
  profile_photo_path: string;
}

export interface HistoryData {
  id: number;
  date_history: string;
  like: number;
  like_user: null | boolean | number;
  status: HistoryStatus;
  type: MediaType;
  url: string;
  user: User;
  user_id: number;
}
