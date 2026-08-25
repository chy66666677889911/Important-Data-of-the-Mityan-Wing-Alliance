-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  salt TEXT NOT NULL,
  nickname TEXT,
  email TEXT,
  points INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  remember_token TEXT
);

-- 签到表
CREATE TABLE IF NOT EXISTS checkin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  date TEXT,
  consecutive INTEGER,
  total INTEGER
);

-- 聊天表
CREATE TABLE IF NOT EXISTS chat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,
  nickname TEXT,
  message TEXT,
  created_at TEXT
);

-- 连飞活动表
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  creator_id INTEGER,
  created_at TEXT
);

-- 活动报名表
CREATE TABLE IF NOT EXISTS event_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER,
  user_id INTEGER,
  callsign TEXT,
  aircraft TEXT,
  gate TEXT,
  created_at TEXT
);

-- 荣誉墙表
CREATE TABLE IF NOT EXISTS honors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  image_url TEXT,
  created_at TEXT
);
