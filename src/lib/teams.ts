import "server-only";
import { listTeammates } from "./chat";
import { getDb } from "./db";
import { logEvent, slugify } from "./matches";
import { isSport } from "./sports";
import type { Sport } from "./types";

/*
 * Takımlar = kayıtlı kadrolar (ekip kararı, Kasım 2026).
 * E-spor klanı gibi kalıcı bir yapı değil: "Cuma Halı Saha Tayfası" gibi sık oynanan kemik kadro bir kez kaydedilir.
 * Yeni maç açarken takım seçilir; üyelere maç daveti gider ve davet edilenler maçın ortak sohbetini görür.
 *
 * Kurallar:
 * - Takıma yalnızca daha önce aynı kadroda oynadığın oyuncular eklenebilir (tanımadığın kişilere toplu davet/spam yok).
 * - Takımı yalnızca kurucusu silebilir. Kurucu her zaman üyedir.
 * - Takımla davet, yalnızca o takımın üyesi olan organizatör tarafından yapılabilir; kadrodakilere davet gitmez.
 */

export const TEAM_MAX_MEMBERS = 30;

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  color: string;
  level: number;
}

export interface Team {
  id: string;
  name: string;
  sport: Sport;
  ownerId: string;
  members: TeamMember[];
}

/** Oyuncunun üyesi olduğu takımlar (kurduğu ya da eklendiği), en yeni başta */
export async function listTeams(playerId: string): Promise<Team[]> {
  const db = await getDb();
  const teams = await db.query<{ id: string; name: string; sport: Sport; owner_id: string }>(
    `SELECT t.id, t.name, t.sport, t.owner_id FROM teams t
     WHERE EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.player_id = $1)
     ORDER BY t.created_at DESC`,
    [playerId],
  );
  if (teams.length === 0) return [];
  const members = await db.query<TeamMember & { team_id: string }>(
    `SELECT tm.team_id, p.id, p.name, p.initials, p.color, p.level FROM team_members tm JOIN players p ON p.id = tm.player_id
     WHERE tm.team_id = ANY($1) ORDER BY p.name`,
    [teams.map((t) => t.id)],
  );
  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    sport: t.sport,
    ownerId: t.owner_id,
    members: members.filter((m) => m.team_id === t.id).map(({ team_id: _, ...m }) => m),
  }));
}

export type TeamInput = { name: string; sport: Sport; memberIds: string[] };

export function validateTeam(body: unknown): { ok: true; value: TeamInput } | { ok: false; errors: string[] } {
  const b = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (name.length < 2 || name.length > 40) errors.push("Takım adı 2–40 karakter olmalı.");
  if (!isSport(b.sport)) errors.push("Geçersiz branş.");
  const ids = Array.isArray(b.memberIds) ? [...new Set(b.memberIds.filter((x): x is string => typeof x === "string"))] : [];
  if (ids.length === 0) errors.push("Takıma en az bir oyuncu ekle.");
  if (ids.length > TEAM_MAX_MEMBERS - 1) errors.push(`Bir takımda en fazla ${TEAM_MAX_MEMBERS} kişi olabilir.`);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { name, sport: b.sport as Sport, memberIds: ids } };
}

export type CreateTeamResult = { ok: true; id: string } | { ok: false; status: 400; error: string };

export async function createTeam(ownerId: string, input: TeamInput): Promise<CreateTeamResult> {
  const known = new Set((await listTeammates(ownerId)).map((t) => t.id));
  const memberIds = input.memberIds.filter((id) => id !== ownerId);
  if (memberIds.some((id) => !known.has(id))) {
    return { ok: false, status: 400, error: "Takıma yalnızca daha önce birlikte oynadığın oyuncuları ekleyebilirsin." };
  }
  const db = await getDb();
  const id = slugify(input.name);
  await db.transaction(async (tx) => {
    await tx.query("INSERT INTO teams (id, owner_id, name, sport) VALUES ($1, $2, $3, $4)", [id, ownerId, input.name, input.sport]);
    for (const pid of [ownerId, ...memberIds]) {
      await tx.query("INSERT INTO team_members (team_id, player_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, pid]);
    }
  });
  await logEvent(ownerId, "team_created", undefined, { teamId: id, sport: input.sport, members: memberIds.length + 1 });
  return { ok: true, id };
}

export type DeleteTeamResult = { ok: true } | { ok: false; status: 403 | 404; error: string };

export async function deleteTeam(teamId: string, playerId: string): Promise<DeleteTeamResult> {
  const db = await getDb();
  const [team] = await db.query<{ owner_id: string }>("SELECT owner_id FROM teams WHERE id = $1", [teamId]);
  if (!team) return { ok: false, status: 404, error: "Takım bulunamadı." };
  if (team.owner_id !== playerId) return { ok: false, status: 403, error: "Takımı yalnızca kurucusu silebilir." };
  await db.query("DELETE FROM teams WHERE id = $1", [teamId]);
  return { ok: true };
}

export type InviteResult = { ok: true; invited: number } | { ok: false; status: 403 | 404 | 409; error: string };

/** Takımın kadroda olmayan bütün üyelerini maça davet eder */
export async function inviteTeam(matchId: string, teamId: string, inviterId: string): Promise<InviteResult> {
  const db = await getDb();
  const [match] = await db.query<{ organizer_id: string; started: boolean }>(
    "SELECT organizer_id, starts_at <= now() AS started FROM matches WHERE id = $1",
    [matchId],
  );
  if (!match) return { ok: false, status: 404, error: "Maç bulunamadı." };
  if (match.organizer_id !== inviterId) return { ok: false, status: 403, error: "Takımı yalnızca maçın organizatörü davet edebilir." };
  if (match.started) return { ok: false, status: 409, error: "Maç başladı, davet gönderilemez." };
  const member = await db.query("SELECT 1 FROM team_members WHERE team_id = $1 AND player_id = $2", [teamId, inviterId]);
  if (member.length === 0) return { ok: false, status: 403, error: "Yalnızca üyesi olduğun takımı davet edebilirsin." };

  const rows = await db.query(
    `INSERT INTO match_invites (match_id, player_id, invited_by, team_id)
     SELECT $1, tm.player_id, $3, $2 FROM team_members tm
     WHERE tm.team_id = $2 AND tm.player_id <> $3
       AND NOT EXISTS (SELECT 1 FROM match_participants mp WHERE mp.match_id = $1 AND mp.player_id = tm.player_id)
     ON CONFLICT DO NOTHING RETURNING player_id`,
    [matchId, teamId, inviterId],
  );
  await logEvent(inviterId, "team_invited", matchId, { teamId, invited: rows.length });
  return { ok: true, invited: rows.length };
}

/** Oyuncunun bu maça daveti (yoksa null) */
export async function getInvite(matchId: string, playerId: string): Promise<{ by: string; team: string | null } | null> {
  const db = await getDb();
  const [row] = await db.query<{ by: string; team: string | null }>(
    `SELECT p.name AS by, t.name AS team FROM match_invites i JOIN players p ON p.id = i.invited_by
     LEFT JOIN teams t ON t.id = i.team_id WHERE i.match_id = $1 AND i.player_id = $2`,
    [matchId, playerId],
  );
  return row ?? null;
}
