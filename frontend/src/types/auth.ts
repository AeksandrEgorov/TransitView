export type UserRole =
  | "Kasutaja"
  | "Andmebaasi_toimetaja"
  | "Administraator";

export interface AuthUser {
  user_id: number;
  username: string;
  role: UserRole;
}