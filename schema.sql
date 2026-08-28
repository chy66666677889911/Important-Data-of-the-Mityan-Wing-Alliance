CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    is_admin INTEGER DEFAULT 0
);

CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    status TEXT DEFAULT '未开始',
    created_by TEXT DEFAULT ''
);

CREATE TABLE signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    pilot_id TEXT,
    stand TEXT DEFAULT '',
    callsign TEXT DEFAULT '',
    aircraft TEXT DEFAULT '',
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
    position TEXT DEFAULT '',
    reason TEXT DEFAULT '',
    loyalty INTEGER DEFAULT 0,
    status TEXT DEFAULT '待审核',
    FOREIGN KEY (pilot_id) REFERENCES users(id)
);

-- 默认管理员：ID 0000，密码 admin
INSERT INTO users (id, email, password, is_admin) VALUES ('0000', 'admin@mitianyi.com', 'admin', 1);

-- 示例活动
INSERT INTO events (name, description, status) VALUES ('跨年跨洋连飞', '广州→东京 跨年特别活动', '未开始');
INSERT INTO events (name, description, status) VALUES ('华南区内巡游', '广州-桂林-南宁绕飞', '未开始');
