import prisma from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { dbView } from "../utils/dbView.js";

type UserRoleValue = "Kasutaja" | "Andmebaasi_toimetaja" | "Administraator";

interface GetUsersParams {
  page: number;
  limit: number;
  role?: UserRoleValue;
  search?: string;
}

type CountRow = {
  total: bigint | number;
};

type AdminUserViewRow = {
  user_id: number;
  username: string;
  role: string;
  created_at: Date;

  vehicles_count: number;
  photos_count: number;

  pending_vehicles_count: number;
  confirmed_vehicles_count: number;
  rejected_vehicles_count: number;

  pending_photos_count: number;
  confirmed_photos_count: number;
  rejected_photos_count: number;
};

function mapAdminUserFromView(row: AdminUserViewRow) {
  return {
    user_id: row.user_id,
    username: row.username,
    role: row.role as UserRoleValue,
    created_at: row.created_at,

    vehicles_count: row.vehicles_count ?? 0,
    photos_count: row.photos_count ?? 0,

    pending_vehicles_count: row.pending_vehicles_count ?? 0,
    confirmed_vehicles_count: row.confirmed_vehicles_count ?? 0,
    rejected_vehicles_count: row.rejected_vehicles_count ?? 0,

    pending_photos_count: row.pending_photos_count ?? 0,
    confirmed_photos_count: row.confirmed_photos_count ?? 0,
    rejected_photos_count: row.rejected_photos_count ?? 0,
  };
}

export async function getUsers(params: GetUsersParams) {
  const { page, limit, role, search } = params;

  const skip = (page - 1) * limit;
  const filters: Prisma.Sql[] = [];

  if (role) {
    filters.push(Prisma.sql`u.role = ${role}`);
  }

  if (search) {
    filters.push(Prisma.sql`u.username ILIKE ${`%${search}%`}`);
  }

  const whereSql =
    filters.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
      : Prisma.empty;

  const [items, totalRows] = await Promise.all([
    prisma.$queryRaw<AdminUserViewRow[]>`
      SELECT *
      FROM ${Prisma.raw(dbView("v_admin_users"))} u
      ${whereSql}
      ORDER BY u.created_at DESC, u.user_id DESC
      OFFSET ${skip}
      LIMIT ${limit}
    `,

    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS total
      FROM ${Prisma.raw(dbView("v_admin_users"))} u
      ${whereSql}
    `,
  ]);

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
  role: UserRoleValue;
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
    role?: UserRoleValue;
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