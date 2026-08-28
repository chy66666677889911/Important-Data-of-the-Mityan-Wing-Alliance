-- Cloudflare D1 数据库
CREATE TABLE users (
    id TEXT PRIMARY KEY,  -- 四位数字
    email TEXT UNIQUE,
    password TEXT,
    is_admin INTEGER DEFAULT 0
);

CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    image TEXT,
    description TEXT,
    status TEXT DEFAULT '未开始',
    created_by TEXT
);

CREATE TABLE signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    pilot_id TEXT,
    stand TEXT,
    callsign TEXT,
    aircraft TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (pilot_id) REFERENCES users(id)
);

CREATE TABLE announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);

CREATE TABLE applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pilot_id TEXT,
    position TEXT,
    reason TEXT,
    loyalty INTEGER,
    status TEXT DEFAULT '待审核',
    FOREIGN KEY (pilot_id) REFERENCES users(id)
);

