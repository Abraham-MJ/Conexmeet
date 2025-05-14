export interface UserHistory {
  id: number;
  type: string;
  url: string;
  user_id: number;
  status: number;
  date_history: string;
  like: number;
  created_at: string;
  updated_at: string;
}

export interface UserData {
  id: number;
  name: string;
  legal_denomintation: string;
  email: string;
  email_verified_at: string | null;
  type: string;
  gender: string;
  status: number;
  store_id: number | null;
  confirmed: number;
  confirmation_code: string | null;
  device_key: string | null;
  host: string;
  is_active: number;
  in_call: number;
  current_team_id: number | null;
  profile_photo_path: string;
  created_at: string;
  updated_at: string;
  language_id: number;
  points: number;
  minutes: number;
  suspended: number;
  last_activity: string;
  myinvitecode: string | null;
  level_id: number;
  otp: string | null;
  phone: string | null;
  birthdate: string;
  country_id: number;
  referral_code: string;
  referred_by: string | null;
  passport_photo_user: string | null;
  passport: string | null;
  passport_back: string | null;
  agency_percentaje: number;
  show_profile_photo: number;
  stripe_id: string | null;
  pm_type: string | null;
  pm_last_four: string | null;
  trial_ends_at: string | null;
  type_user: string;
  premium_expires_at: string | null;
  minutes_conex: number;
  history: UserHistory[];
}
