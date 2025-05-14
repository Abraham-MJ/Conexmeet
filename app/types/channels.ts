export interface RoomData {
  id: number;
  host_id: string;
  user_id: number;
  another_user_id: number | null;
  started_at: string;
  ended_at: string;
  created_at: string;
  updated_at: string;
  status: string;
}
