// 检查登录状态
const pilotId = localStorage.getItem('pilotId');
if (!pilotId && !window.location.href.includes('index.html') && !window.location.href.includes('register.html')) {
    window.location.href = 'index.html';
}

// 登录
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password, remember })
    });
    const data = await res.json();
    if (data.success) {
        localStorage.setItem('pilotId', id);
        window.location.href = 'dashboard.html';
    } else {
        alert(data.message);
    }
});

// 注册
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('pilotId').value;
    if (!/^\d{4}$/.test(id)) { alert('ID必须是四位数字'); return; }
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, email, password })
    });
    const data = await res.json();
    if (data.success) {
        alert('注册成功');
        window.location.href = 'index.html';
    } else {
        alert(data.message);
    }
});

// 显示不同区域
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

// 大厅数据加载
if (window.location.href.includes('dashboard.html')) {
    document.getElementById('pilotName').textContent = pilotId;
    // 获取天气和附近机场（通过IP）
    fetch('/api/weather?pilotId=' + pilotId)
        .then(r => r.json())
        .then(data => {
            document.getElementById('weather').textContent = data.weather;
            document.getElementById('nearbyAirports').textContent = data.airports;
        });
    // 在线人数
    fetch('/api/online')
        .then(r => r.json())
        .then(data => {
            document.getElementById('onlineCount').textContent = data.count;
        });
    // 公告
    fetch('/api/announcements')
        .then(r => r.json())
        .then(data => {
            document.getElementById('announcements').innerHTML = data.map(a => `<p>${a}</p>`).join('');
        });
    // 检查是否是管理员
    fetch('/api/isAdmin?pilotId=' + pilotId)
        .then(r => r.json())
        .then(data => {
            if (data.isAdmin) {
                document.getElementById('adminAnnounce').style.display = 'block';
            }
        });
}

// 发布系统公告（管理员）
async function postAnnouncement() {
    const text = document.getElementById('announceText').value;
    await fetch('/api/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilotId, text })
    });
    alert('公告已发布');
}

// 连飞活动
async function loadEvents() {
    const res = await fetch('/api/events');
    const events = await res.json();
    const list = document.getElementById('eventList');
    list.innerHTML = '';
    events.forEach(ev => {
        const div = document.createElement('div');
        div.className = 'section';
        div.innerHTML = `
            <h3>${ev.name}</h3>
            <img src="${ev.image}" width="100%">
            <p>${ev.description}</p>
            <p>状态: ${ev.status}</p>
            ${ev.status === '未开始' ? '<button onclick="signUp(' + ev.id + ')">报名</button>' : ''}
        `;
        list.appendChild(div);
    });
}
async function signUp(eventId) {
    const stand = prompt('请输入停机位');
    const callsign = prompt('请输入游戏呼号');
    const aircraft = prompt('请输入所使用机型');
    await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, pilotId, stand, callsign, aircraft })
    });
    alert('报名成功');
}

// METAR查询
async function getMetar() {
    const icao = document.getElementById('icaoMetar').value;
    const res = await fetch('/api/metar?icao=' + icao);
    const data = await res.json();
    document.getElementById('metarResult').textContent = data.metar;
}

// 航路查询
async function getRoute() {
    const dep = document.getElementById('dep').value;
    const arr = document.getElementById('arr').value;
    const res = await fetch(`/api/route?dep=${dep}&arr=${arr}`);
    const data = await res.json();
    document.getElementById('routeResult').textContent = data.route;
}

// 职员申请
document.getElementById('applyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const position = document.getElementById('position').value;
    const reason = document.getElementById('reason').value;
    const loyalty = document.getElementById('loyalty').checked;
    if (!loyalty) { alert('必须效忠联盟'); return; }
    
    await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilotId, position, reason, loyalty })
    });
    alert('申请已提交');
});

