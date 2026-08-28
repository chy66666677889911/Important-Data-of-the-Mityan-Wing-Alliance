// ========== 全局 ==========
const API_BASE = 'https://api.mtyafa.ccwu.cc';

const pilotId = localStorage.getItem('pilotId');
const currentPage = window.location.pathname;

if (!pilotId && !currentPage.includes('index.html') && !currentPage.includes('register.html')) {
    window.location.href = 'index.html';
}

// ========== 登录 ==========
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;

        if (!/^\d{4}$/.test(id)) { alert('ID 必须是四位数字'); return; }

        try {
            const res = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, password, remember })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('pilotId', id);
                window.location.href = 'dashboard.html';
            } else {
                alert(data.message || '登录失败');
            }
        } catch (err) {
            alert('网络错误，请稍后重试');
        }
    });
}

// ========== 注册 ==========
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('pilotId').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!/^\d{4}$/.test(id)) { alert('ID 必须是四位数字'); return; }
        if (password.length < 6) { alert('密码至少6位'); return; }

        try {
            const res = await fetch(`${API_BASE}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, email, password })
            });
            const data = await res.json();
            if (data.success) {
                alert('注册成功！请登录');
                window.location.href = 'index.html';
            } else {
                alert(data.message || '注册失败');
            }
        } catch (err) {
            alert('网络错误，请稍后重试');
        }
    });
}

// ========== 退出 ==========
function logout() {
    localStorage.removeItem('pilotId');
    localStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
}

// ========== 切换区域 ==========
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    if (id === 'events') loadEvents();
}

// ========== 大厅数据 ==========
if (currentPage.includes('dashboard.html')) {
    document.getElementById('pilotName').textContent = pilotId || '未知';

    // 天气
    fetch(`${API_BASE}/api/metar?icao=ZGGG`)
        .then(r => r.text())
        .then(text => {
            document.getElementById('weather').textContent = text.substring(0, 60) + '...';
        })
        .catch(() => {
            document.getElementById('weather').textContent = '天气获取失败';
        });

    // 附近机场
    document.getElementById('nearbyAirports').textContent = 'ZGGG（广州白云）, ZGKL（桂林两江）, ZGNN（南宁吴圩）';
    document.getElementById('onlineCount').textContent = Math.floor(Math.random() * 20 + 5);

    // 公告（从 D1 读取）
    fetch(`${API_BASE}/api/announcements`)
        .then(r => r.json())
        .then(list => {
            if (list.length) {
                document.getElementById('announcements').innerHTML =
                    list.map(a => `<p style="padding:5px 0;border-bottom:1px solid #eee;">📢 ${a}</p>`).join('');
            }
        })
        .catch(() => {
            document.getElementById('announcements').innerHTML = '<p style="color:#999;">公告加载失败</p>';
        });

    // 管理员检查
    fetch(`${API_BASE}/api/isAdmin?pilotId=${pilotId}`)
        .then(r => r.json())
        .then(d => {
            if (d.isAdmin) {
                document.getElementById('adminAnnounce').style.display = 'block';
                localStorage.setItem('isAdmin', 'true');
            }
        });
}

// ========== 发布公告 ==========
async function postAnnouncement() {
    const text = document.getElementById('announceText').value.trim();
    if (!text) return;
    const res = await fetch(`${API_BASE}/api/announce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilotId, text })
    });
    const data = await res.json();
    if (data.success) {
        alert('公告已发布');
        location.reload();
    } else {
        alert('发布失败：' + (data.message || ''));
    }
}

// ========== 连飞活动 ==========
async function loadEvents() {
    const list = document.getElementById('eventList');
    list.innerHTML = '<p style="color:#999;">加载中...</p>';
    try {
        const res = await fetch(`${API_BASE}/api/events`);
        const events = await res.json();
        if (!events.length) {
            list.innerHTML = '<p style="color:#999;">暂无活动</p>';
            return;
        }
        list.innerHTML = '';
        events.forEach(ev => {
            const div = document.createElement('div');
            div.className = 'event-card';
            const canSignup = ev.status === '未开始';
            div.innerHTML = `
                <h3>${ev.name}</h3>
                ${ev.image ? `<img src="${ev.image}" style="width:100%;max-height:150px;object-fit:cover;border-radius:8px;margin:8px 0;">` : ''}
                <p>${ev.description}</p>
                <span class="status ${canSignup ? 'status-waiting' : 'status-ended'}">${ev.status}</span>
                ${canSignup ? `<br><button onclick="signUp(${ev.id})">报名</button>` : '<p style="color:#999;margin-top:8px;">活动已结束或已开始</p>'}
            `;
            list.appendChild(div);
        });
    } catch (err) {
        list.innerHTML = '<p style="color:#999;">加载失败</p>';
    }
}

async function signUp(eventId) {
    const stand = prompt('请输入停机位（如 T2-35）：');
    if (!stand) return;
    const callsign = prompt('请输入游戏呼号（如 MTY1001）：');
    if (!callsign) return;
    const aircraft = prompt('请输入所使用机型（如 B738）：');
    if (!aircraft) return;

    try {
        const res = await fetch(`${API_BASE}/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId, pilotId, stand, callsign, aircraft })
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ 报名成功！');
        } else {
            alert('报名失败');
        }
    } catch (err) {
        alert('网络错误');
    }
}

// ========== METAR ==========
async function getMetar() {
    const icao = document.getElementById('icaoMetar').value.trim().toUpperCase();
    if (!icao) { alert('请输入 ICAO 代码'); return; }
    const resultBox = document.getElementById('metarResult');
    resultBox.textContent = '查询中...';
    try {
        const res = await fetch(`${API_BASE}/api/metar?icao=${icao}`);
        const text = await res.text();
        resultBox.textContent = text || '未获取到数据';
    } catch (err) {
        resultBox.textContent = '查询失败，请检查网络';
    }
}

// ========== 航路 ==========
async function getRoute() {
    const dep = document.getElementById('dep').value.trim().toUpperCase();
    const arr = document.getElementById('arr').value.trim().toUpperCase();
    if (!dep || !arr) { alert('请输入起降机场'); return; }
    const resultBox = document.getElementById('routeResult');
    resultBox.textContent = '计算中...';
    try {
        const res = await fetch(`${API_BASE}/api/route?dep=${dep}&arr=${arr}`);
        const data = await res.json();
        if (data.error) {
            resultBox.textContent = '查询失败：' + data.error;
        } else {
            resultBox.textContent =
                `航路：${data.route}\n大圆距离：${data.distance_nm} nm\n备注：${data.note}`;
        }
    } catch (err) {
        resultBox.textContent = '查询失败，请检查网络';
    }
}

// ========== 职员申请 ==========
const applyForm = document.getElementById('applyForm');
if (applyForm) {
    applyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const position = document.getElementById('position').value;
        const reason = document.getElementById('reason').value.trim();
        const loyalty = document.getElementById('loyalty').checked;

        if (!loyalty) { alert('必须勾选效忠联盟'); return; }
        if (reason.length < 10) { alert('申请理由至少10个字'); return; }

        try {
            const res = await fetch(`${API_BASE}/api/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pilotId, position, reason, loyalty })
            });
            const data = await res.json();
            if (data.success) {
                alert('✅ 申请已提交，请等待管理员审核');
                applyForm.reset();
            } else {
                alert('提交失败');
            }
        } catch (err) {
            alert('网络错误');
        }
    });
}
