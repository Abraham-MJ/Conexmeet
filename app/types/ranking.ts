export interface RankingItem {
  id: number;
  name: string;
  points: number;
  profile_photo_path: string;
  minutes: number;
}

export interface UseRankingDataReturn {
  data: RankingItem[] | null;
  loading: boolean;
  error: string | null;
  fetchRanking: () => Promise<void>;
}

export interface ApiResponse {
  success: boolean;
  data?: RankingItem[];
  message?: string;
}
