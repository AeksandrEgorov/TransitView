import prisma from "../config/prisma.js";

export async function getAllUsers() {
  return prisma.users.findMany({
    orderBy: {
      created_at: "desc",
    },
    select: {
      user_id: true,
      username: true,
      role: true,
      created_at: true,
    },
  });
}

export async function getUserById(userId: number) {
  return prisma.users.findUnique({
    where: {
      user_id: userId,
    },
    select: {
      user_id: true,
      username: true,
      role: true,
      created_at: true,
    },
  });
}

export async function getUserByUsername(username: string) {
  return prisma.users.findUnique({
    where: {
      username,
    },
  });
}

export async function createUser(data: {
  username: string;
  password_hash: string;
  role: "Kasutaja" | "Andmebaasi_toimetaja" | "Administraator";
}) {
  return prisma.users.create({
    data,
    select: {
      user_id: true,
      username: true,
      role: true,
      created_at: true,
    },
  });
}

export async function updateUser(
  userId: number,
  data: {
    username?: string;
    password_hash?: string;
    role?: "Kasutaja" | "Andmebaasi_toimetaja" | "Administraator";
  }
) {
  return prisma.users.update({
    where: {
      user_id: userId,
    },
    data,
    select: {
      user_id: true,
      username: true,
      role: true,
      created_at: true,
    },
  });
}

export async function deleteUser(userId: number) {
  return prisma.users.delete({
    where: {
      user_id: userId,
    },
    select: {
      user_id: true,
      username: true,
      role: true,
    },
  });
}