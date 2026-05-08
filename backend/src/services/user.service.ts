import prisma from "../config/prisma.js";
import { Prisma, UserRole } from "../generated/prisma/client.js";
import { dbView } from "../utils/dbView.js";

interface GetUsersParams {
  page: number;
  limit: number;
  role?: UserRole;
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

type CountRow = {
  total: bigint | number;
};

type AdminUserViewRow = {
  user_id: number;
  username: string;
  role: string;
  created_at: Date;

  vehicles_count: number | bigint;
  photos_count: number | bigint;

  pending_vehicles_count: number | bigint;
  confirmed_vehicles_count: number | bigint;
  rejected_vehicles_count: number | bigint;

  pending_photos_count: number | bigint;
  confirmed_photos_count: number | bigint;
  rejected_photos_count: number | bigint;
};

function toNumber(value: number | bigint | null | undefined) {
  return Number(value ?? 0);
}

function mapAdminUserFromView(row: AdminUserViewRow) {
  return {
    user_id: row.user_id,
    username: row.username,
    role: row.role as UserRole,
    created_at: row.created_at,

    vehicles_count: toNumber(row.vehicles_count),
    photos_count: toNumber(row.photos_count),

    pending_vehicles_count: toNumber(row.pending_vehicles_count),
    confirmed_vehicles_count: toNumber(row.confirmed_vehicles_count),
    rejected_vehicles_count: toNumber(row.rejected_vehicles_count),

    pending_photos_count: toNumber(row.pending_photos_count),
    confirmed_photos_count: toNumber(row.confirmed_photos_count),
    rejected_photos_count: toNumber(row.rejected_photos_count),
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
    filters.push(Prisma.sql`u.username ILIKE ${`%${search}%`}`);
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
  role: UserRole;
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
    role?: UserRole;
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