export const users = [
  {
    username: "user1",
    email: "user1@transitview.ee",
    passwordEnv: "SEED_USER_PASSWORD",
    role: "Kasutaja",
  },
  {
    username: "editor1",
    email: "editor1@transitview.ee",
    passwordEnv: "SEED_EDITOR_PASSWORD",
    role: "Andmebaasi_toimetaja",
  },
  {
    username: "admin1",
    email: "admin1@transitview.ee",
    passwordEnv: "SEED_ADMIN_PASSWORD",
    role: "Administraator",
  },
] as const;
