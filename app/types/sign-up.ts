export interface Credentials {
  name: string;
  last_name: string;
  email: string;
  user_name: string;
  gender: string;
  country_id: string;
  password: string;
  confirm_password: string;
  number_phone?: string;
  date_of_birth: string;
  privacity: boolean;
  code_otp: string;
  referral_code?: string;
}
