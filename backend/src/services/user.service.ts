// This service contains user database logic for the manage users page.
// It reads the admin user view and creates, updates, or deletes user records safely.

import prisma from "../config/prisma.js";
import { Prisma, UserRole } from "../generated/prisma/client.js";
import { dbView } from "../utils/dbView.js";
import type { GetUsersParams } from "../types/user.js";

type CountRow = {
  total: bigint | number;
};

type AdminUserViewRow = {
  user_id: number;
  username: string;
  email: string;
  role: string;
  created_at: Date;

  vehicles_total: number | bigint;
  vehicles_pending: number | bigint;
  vehicles_confirmed: number | bigint;
  vehicles_rejected: number | bigint;

  photos_total: number | bigint;
  photos_pending: number | bigint;
  photos_confirmed: number | bigint;
  photos_rejected: number | bigint;
};

type CreateUserData = {
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
};

type UpdateUserData = {
  username?: string;
  email?: string;
  password_hash?: string;
  role?: UserRole;
};

const userSelect = {
  user_id: true,
  username: true,
  email: true,
  role: true,
  created_at: true,
};

function toNumber(value: number | bigint | null | undefined) {
  return Number(value ?? 0);
}

function mapAdminUserFromView(row: AdminUserViewRow) {
  const vehiclesTotal = toNumber(row.vehicles_total);
  const vehiclesPending = toNumber(row.vehicles_pending);
  const vehiclesConfirmed = toNumber(row.vehicles_confirmed);
  const vehiclesRejected = toNumber(row.vehicles_rejected);

  const photosTotal = toNumber(row.photos_total);
  const photosPending = toNumber(row.photos_pending);
  const photosConfirmed = toNumber(row.photos_confirmed);
  const photosRejected = toNumber(row.photos_rejected);

  return {
    user_id: row.user_id,
    username: row.username,
    email: row.email,
    role: row.role as UserRole,
    created_at: row.created_at,

    vehicles_total: vehiclesTotal,
    vehicles_pending: vehiclesPending,
    vehicles_confirmed: vehiclesConfirmed,
    vehicles_rejected: vehiclesRejected,

    photos_total: photosTotal,
    photos_pending: photosPending,
    photos_confirmed: photosConfirmed,
    photos_rejected: photosRejected,

    vehicles_count: vehiclesTotal,
    photos_count: photosTotal,

    pending_vehicles_count: vehiclesPending,
    confirmed_vehicles_count: vehiclesConfirmed,
    rejected_vehicles_count: vehiclesRejected,

    pending_photos_count: photosPending,
    confirmed_photos_count: photosConfirmed,
    rejected_photos_count: photosRejected,
  };
}

export async function getUsers(params: GetUsersParams) {
  const { page, limit, role, search, createdFrom, createdTo } = params;

  const skip = (page - 1) * limit;
  const filters: Prisma.Sql[] = [];

  if (role) {
    filters.push(Prisma.sql`u.role = ${role}`);
  }

  if (search) {
    const searchValue = `%${search}%`;

    filters.push(Prisma.sql`
      (
        u.username ILIKE ${searchValue}
        OR u.email ILIKE ${searchValue}
      )
    `);
  }

  if (createdFrom) {
    filters.push(Prisma.sql`u.created_at >= ${createdFrom}`);
  }

  if (createdTo) {
    filters.push(Prisma.sql`u.created_at <= ${createdTo}`);
  }

  const whereSql =
    filters.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
      : Prisma.empty;

  const items = await prisma.$queryRaw<AdminUserViewRow[]>`
    SELECT *
    FROM ${Prisma.raw(dbView("v_admin_users"))} u
    ${whereSql}
    ORDER BY u.created_at DESC, u.user_id DESC
    OFFSET ${skip}
    LIMIT ${limit}
  `;

  const totalRows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*) AS total
    FROM ${Prisma.raw(dbView("v_admin_users"))} u
    ${whereSql}
  `;

  const total = Number(totalRows[0]?.total ?? 0);

  return {
    items: items.map(mapAdminUserFromView),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserById(userId: number) {
  return prisma.users.findUnique({
    where: {
      user_id: userId,
    },
    select: userSelect,
  });
}

export async function getUserByUsername(username: string) {
  return prisma.users.findUnique({
    where: {
      username,
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.users.findUnique({
    where: {
      email,
    },
  });
}

export async function createUser(data: CreateUserData) {
  return prisma.users.create({
    data,
    select: userSelect,
  });
}

export async function updateUser(userId: number, data: UpdateUserData) {
  return prisma.users.update({
    where: {
      user_id: userId,
    },
    data,
    select: userSelect,
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
      email: true,
      role: true,
    },
  });
}
