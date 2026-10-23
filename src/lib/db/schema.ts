/**
 * Veritabanı şeması. Uygulama ilk açıldığında çalışır; tablolar zaten varsa bir şey yapmaz.
 *
 * Tesis (saha) kataloğu bilinçli olarak kodda tutulur (src/lib/venues.ts):
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

-- Maç sonu değerlendirmeleri ("Takımı Değerlendir"): her oyuncu, takım arkadaşı başına bir kayıt bırakır.
-- attended: "Geldi / Gelmedi" oyu. praise_id: verilen övgü (src/lib/praise.ts), isteğe bağlı.
CREATE TABLE IF NOT EXISTS match_reviews (
  match_id     text NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_id  text NOT NULL REFERENCES players(id),
  target_id    text NOT NULL REFERENCES players(id),
  attended     boolean NOT NULL,
  praise_id    text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, reviewer_id, target_id),
  CHECK (reviewer_id <> target_id),
  CHECK (attended OR praise_id IS NULL)
);
CREATE INDEX IF NOT EXISTS match_reviews_target_idx ON match_reviews (target_id);
-- "Geç kaldı" oyu: çoğunluk geç kaldı derse o maç "zamanında gelme" XP'si ve serisi sayılmaz.
ALTER TABLE match_reviews ADD COLUMN IF NOT EXISTS late boolean NOT NULL DEFAULT false;

-- Maçın Oyuncusu (MVP) oyları: her oyuncu bir maçta en fazla bir takım arkadaşını seçer.
CREATE TABLE IF NOT EXISTS match_mvp_votes (
  match_id   text NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  voter_id   text NOT NULL REFERENCES players(id),
  target_id  text NOT NULL REFERENCES players(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, voter_id),
  CHECK (voter_id <> target_id)
);

-- S.O.S çağrıları: eksik kadro için yakındaki oyunculara giden acil davet.
-- answered_by dolunca çağrı kapanır; yanıt süresi (answered_at - created_at) panelde ölçülür.
CREATE TABLE IF NOT EXISTS sos_calls (
  id           bigserial PRIMARY KEY,
  match_id     text NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  position     text NOT NULL,
  created_by   text NOT NULL REFERENCES players(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  answered_by  text REFERENCES players(id),
  answered_at  timestamptz
);
CREATE INDEX IF NOT EXISTS sos_calls_open_idx ON sos_calls (expires_at) WHERE answered_by IS NULL;

-- Bildirimler ekranında "Tümünü okundu işaretle": bu andan önceki bildirimler okunmuş sayılır
ALTER TABLE players ADD COLUMN IF NOT EXISTS notifications_seen_at timestamptz;

-- Onaylı katılım: organizatör bu seçeneği açtıysa "Maça Katıl" doğrudan kadroya eklemez, istek oluşturur.
ALTER TABLE matches ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS join_requests (
  match_id    text NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id   text NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  position    text,
  x           double precision,
  y           double precision,
  created_at  timestamptz NOT NULL DEFAULT now(),
  decided_at  timestamptz,
  PRIMARY KEY (match_id, player_id)
);

-- Takım sohbeti: her maçın kadrosu için bir grup sohbeti. Mesaj okuma için kadroda olmak gerekir (src/lib/chat.ts).
CREATE TABLE IF NOT EXISTS messages (
  id          bigserial PRIMARY KEY,
  match_id    text NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id   text NOT NULL REFERENCES players(id),
  body        text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_match_idx ON messages (match_id, id);

-- Okunmamış mesaj sayısı için: oyuncunun her sohbette en son gördüğü mesaj
CREATE TABLE IF NOT EXISTS chat_reads (
  match_id      text NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id     text NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  last_read_id  bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (match_id, player_id)
);

-- Başarısız giriş denemeleri: kaba kuvvetle şifre denemeyi yavaşlatmak için (src/lib/auth.ts → loginBlocked)
CREATE TABLE IF NOT EXISTS login_attempts (
  id          bigserial PRIMARY KEY,
  email       text NOT NULL,
  ip          text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_email_idx ON login_attempts (email, created_at);

CREATE INDEX IF NOT EXISTS matches_starts_at_idx ON matches (starts_at);
CREATE INDEX IF NOT EXISTS user_events_created_at_idx ON user_events (created_at);

-- Düzeltme: ilk sürümde payload metin olarak kaydedilmişti ("{...}"), gerçek JSON nesnesine çevir.
UPDATE user_events SET payload = (payload #>> '{}')::jsonb WHERE jsonb_typeof(payload) = 'string';

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_mvp_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reads ENABLE ROW LEVEL SECURITY;
`;
