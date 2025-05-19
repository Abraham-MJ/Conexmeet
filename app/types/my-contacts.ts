export interface ContactUser {
  id: number;
  name: string;
  email: string;
  profile_photo_path: string;
}

export interface ContactData {
  id: number;
  name: string | null;
  user_id: number;
  contact_id: number;
  created_at: string;
  updated_at: string;
  request_status: string;
  contact_status: string;
  user: ContactUser;
  chat_id?: string;
}
