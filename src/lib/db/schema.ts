/**
 * Veritabanı şeması. Uygulama ilk açıldığında çalışır; tablolar zaten varsa bir şey yapmaz.
 *
 * Tesis (saha) kataloğu bilinçli olarak kodda tutulur (src/lib/mock-data.ts → venues):
 * nadiren değişen referans veridir ve /saha/[id] sayfaları build anında (SSG) üretilir.
 * Değişen veriler (oyuncular, maçlar, katılımlar, olaylar) veritabanındadır.
 *
 * RLS (Row Level Security) açık ve hiç kural tanımlı değil: Supabase'in herkese açık Data API'si
 * bu tablolara erişemez. Veriye yalnızca bizim API'miz (sunucu bağlantısı) üzerinden ulaşılır.
 */
export const SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS players (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  initials    text NOT NULL DEFAULT '',
  color       text NOT NULL DEFAULT 'bg-info',
  level       integer NOT NULL DEFAULT 1,
  rating      double precision NOT NULL DEFAULT 4,
  overall     integer NOT NULL DEFAULT 70,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id            text PRIMARY KEY,
  venue_id      text NOT NULL,
  title         text NOT NULL,
  sport         text NOT NULL CHECK (sport IN ('futbol', 'basketbol', 'voleybol', 'tenis')),
  format        text NOT NULL,
  starts_at     timestamptz NOT NULL,
  price         integer NOT NULL DEFAULT 0 CHECK (price >= 0),
  capacity      integer NOT NULL CHECK (capacity > 0),
  min_level     integer NOT NULL DEFAULT 1,
  is_public     boolean NOT NULL DEFAULT true,
  note          text NOT NULL DEFAULT '',
  organizer_id  text NOT NULL REFERENCES players(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_participants (
  match_id   text NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id  text NOT NULL REFERENCES players(id),
  position   text,
  x          double precision,
  y          double precision,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, player_id)
);

-- Kullanıcı davranışlarının kaydı. Dashboard bu tablodan beslenecek.
CREATE TABLE IF NOT EXISTS user_events (
  id          bigserial PRIMARY KEY,
  player_id   text REFERENCES players(id),
  type        text NOT NULL,
  match_id    text,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Giriş sistemi: örnek oyuncuların e-postası yoktur, yalnızca kayıt olanların vardır.
ALTER TABLE players ADD COLUMN IF NOT EXISTS email text UNIQUE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS password_hash text;

-- Oturumlar: tarayıcıdaki çerezde rastgele bir anahtar durur, burada yalnızca onun SHA-256 özeti saklanır.
-- Veritabanı sızsa bile özetlerden oturum çalınamaz.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  text PRIMARY KEY,
  player_id   text NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS matches_starts_at_idx ON matches (starts_at);
CREATE INDEX IF NOT EXISTS user_events_created_at_idx ON user_events (created_at);

-- Düzeltme: ilk sürümde payload metin olarak kaydedilmişti ("{...}"), gerçek JSON nesnesine çevir.
UPDATE user_events SET payload = (payload #>> '{}')::jsonb WHERE jsonb_typeof(payload) = 'string';

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
`;
