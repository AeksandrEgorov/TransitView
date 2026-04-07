export interface CreateUserBody {
  username: string;
  password: string;
  role: "Kasutaja" | "Andmebaasi_toimetaja" | "Administraator";
}

export interface UpdateUserBody {
  username?: string;
  password?: string;
  role?: "Kasutaja" | "Andmebaasi_toimetaja" | "Administraator";
}