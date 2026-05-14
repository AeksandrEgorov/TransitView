// This service builds the counts shown on public and dashboard summary cards.
// It reads database views so the frontend gets small ready-to-use stat objects.

import prisma from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { dbView } from "../utils/dbView.js";

type PublicStatsRow = {
  vehicles_total: number | bigint;
  photos_total: number | bigint;
  categories_total: number | bigint;
  cities_total: number | bigint;
};

type StatusStatsRow = {
  total: number | bigint;
  pending: number | bigint;
  confirmed: number | bigint;
  rejected: number | bigint;
};

type UserStatsRow = {
  total: number | bigint;
  regular_users: number | bigint;
  editors: number | bigint;
  admins: number | bigint;
};

type QueueStatsRow = {
  total: number | bigint;
};

function toNumber(value: number | bigint | null | undefined) {
  return Number(value ?? 0);
}

function mapStatusStats(row: StatusStatsRow | undefined) {
  return {
    total: toNumber(row?.total),
    pending: toNumber(row?.pending),
    confirmed: toNumber(row?.confirmed),
    rejected: toNumber(row?.rejected),
  };
}

export async function getPublicStats() {
  const rows = await prisma.$queryRaw<PublicStatsRow[]>`
    SELECT
      vehicles_total,
      photos_total,
      categories_total,
      cities_total
    FROM ${Prisma.raw(dbView("v_public_stats"))}
    LIMIT 1
  `;

  const stats = rows[0];

  return {
    vehicles_total: toNumber(stats?.vehicles_total),
    photos_total: toNumber(stats?.photos_total),
    categories_total: toNumber(stats?.categories_total),
    cities_total: toNumber(stats?.cities_total),
  };
}

export async function getMyStats(userId: number) {
  const vehicleRows = await prisma.$queryRaw<StatusStatsRow[]>`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status::text = 'Ootel')::int AS pending,
      COUNT(*) FILTER (WHERE status::text = 'Kinnitatud')::int AS confirmed,
      COUNT(*) FILTER (WHERE status::text = 'Tagasi_lukatud')::int AS rejected
    FROM ${Prisma.raw(dbView("v_my_vehicles"))}
    WHERE created_by = ${userId}
  `;

  const photoRows = await prisma.$queryRaw<StatusStatsRow[]>`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status::text = 'Ootel')::int AS pending,
      COUNT(*) FILTER (WHERE status::text = 'Kinnitatud')::int AS confirmed,
      COUNT(*) FILTER (WHERE status::text = 'Tagasi_lukatud')::int AS rejected
    FROM ${Prisma.raw(dbView("v_my_photos"))}
    WHERE author_id = ${userId}
  `;

  const vehicles = mapStatusStats(vehicleRows[0]);
  const photos = mapStatusStats(photoRows[0]);

  return {
    vehicles,
    photos,
    total_items: vehicles.total + photos.total,
    pending_total: vehicles.pending + photos.pending,
    confirmed_total: vehicles.confirmed + photos.confirmed,
    rejected_total: vehicles.rejected + photos.rejected,
  };
}

export async function getManageStats() {
  const vehicleRows = await prisma.$queryRaw<StatusStatsRow[]>`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status::text = 'Ootel')::int AS pending,
      COUNT(*) FILTER (WHERE status::text = 'Kinnitatud')::int AS confirmed,
      COUNT(*) FILTER (WHERE status::text = 'Tagasi_lukatud')::int AS rejected
    FROM ${Prisma.raw(dbView("v_manage_vehicles"))}
  `;

  const photoRows = await prisma.$queryRaw<StatusStatsRow[]>`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status::text = 'Ootel')::int AS pending,
      COUNT(*) FILTER (WHERE status::text = 'Kinnitatud')::int AS confirmed,
      COUNT(*) FILTER (WHERE status::text = 'Tagasi_lukatud')::int AS rejected
    FROM ${Prisma.raw(dbView("v_manage_photos"))}
  `;

  const userRows = await prisma.$queryRaw<UserStatsRow[]>`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE role::text = 'Kasutaja')::int AS regular_users,
      COUNT(*) FILTER (WHERE role::text = 'Andmebaasi_toimetaja')::int AS editors,
      COUNT(*) FILTER (WHERE role::text = 'Administraator')::int AS admins
    FROM ${Prisma.raw(dbView("v_admin_users"))}
  `;

  const queueRows = await prisma.$queryRaw<QueueStatsRow[]>`
    SELECT COUNT(*)::int AS total
    FROM ${Prisma.raw(dbView("v_moderation_queue"))}
  `;

  const vehicles = mapStatusStats(vehicleRows[0]);
  const photos = mapStatusStats(photoRows[0]);
  const users = userRows[0];
  const queue = queueRows[0];

  return {
    vehicles,
    photos,
    users: {
      total: toNumber(users?.total),
      regular_users: toNumber(users?.regular_users),
      editors: toNumber(users?.editors),
      admins: toNumber(users?.admins),
    },
    total_items: vehicles.total + photos.total,
    moderation_queue_total: toNumber(queue?.total),
    pending_total: vehicles.pending + photos.pending,
    confirmed_total: vehicles.confirmed + photos.confirmed,
    rejected_total: vehicles.rejected + photos.rejected,
  };
}
