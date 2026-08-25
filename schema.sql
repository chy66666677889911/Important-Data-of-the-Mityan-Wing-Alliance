-- ===============================
-- 用户表（核心）
-- ===============================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,        -- 4位数字ID
  nickname TEXT NOT NULL,               -- 飞行员呼号
  password TEXT NOT NULL,               -- 明文（测试用，后续可哈希）
  points INTEGER DEFAULT 0,             -- 联盟积分
  is_admin INTEGER DEFAULT 0,           -- 0=普通 1=管理员
  status INTEGER DEFAULT 1,             -- 1=正常 0=封禁
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- 连飞活动表
-- ===============================
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,                  -- 活动标题
  description TEXT,                     -- 活动说明
  departure TEXT,                       -- 起飞机场
  arrival TEXT,                         -- 目的机场
  event_time TEXT,                      -- 活动时间
  creator_id INTEGER NOT NULL,          -- 发布者
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- ===============================
-- 活动报名表
-- ===============================
CREATE TABLE IF NOT EXISTS event_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  callsign TEXT,                        -- 呼号
  aircraft TEXT,                        -- 机型
  parking TEXT,                         -- 停机位
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===============================
-- 塔台聊天室
-- ===============================
CREATE TABLE IF NOT EXISTS chat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  nickname TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===============================
-- 荣誉墙
-- ===============================
CREATE TABLE IF NOT EXISTS honors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,                  -- 荣誉名称
  description TEXT,                     -- 荣誉说明
  image_url TEXT,                       -- 证书/截图
  created_by INTEGER NOT NULL,          -- 管理员ID
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ===============================
-- 签到表
-- ===============================
CREATE TABLE IF NOT EXISTS checkin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,                   -- YYYY-MM-DD
  points INTEGER DEFAULT 1,
  UNIQUE(user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===============================
-- 积分变动日志（可选但强烈建议）
-- ===============================
CREATE TABLE IF NOT EXISTS points_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  change INTEGER NOT NULL,              -- +10 / -5
  reason TEXT,                          -- 活动奖励 / 违规扣除
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
