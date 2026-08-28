import json
import urllib.request
import urllib.parse
import math
from js import Response

# ========== 工具 ==========
def fetch_json(url, timeout=5):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"error": str(e)}

def fetch_text(url, timeout=5):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.read().decode().strip()
    except Exception as e:
        return f"获取失败: {e}"

# ========== METAR ==========
def get_metar(icao):
    url = f"https://aviationweather.gov/api/data/metar?ids={icao.upper()}&format=raw&taf=false&hours=1"
    return fetch_text(url)

# ========== 机场信息 ==========
def get_station_info(icao):
    url = f"https://aviationweather.gov/api/data/stationinfo?ids={icao.upper()}"
    data = fetch_json(url)
    if isinstance(data, list) and len(data) > 0:
        return data[0]
    return None

# ========== 大圆航路 ==========
def deg2rad(d): return d * math.pi / 180
def rad2deg(r): return r * 180 / math.pi

def great_circle_route(dep_icao, arr_icao):
    dep = get_station_info(dep_icao)
    arr = get_station_info(arr_icao)
    if not dep or not arr:
        return {"error": "机场信息获取失败，请检查 ICAO 代码"}

    lat1, lon1 = float(dep.get("lat", 0)), float(dep.get("lon", 0))
    lat2, lon2 = float(arr.get("lat", 0)), float(arr.get("lon", 0))

    rlat1, rlon1 = deg2rad(lat1), deg2rad(lon1)
    rlat2, rlon2 = deg2rad(lat2), deg2rad(lon2)
    d = math.acos(
        math.sin(rlat1) * math.sin(rlat2) +
        math.cos(rlat1) * math.cos(rlat2) * math.cos(rlon2 - rlon1)
    ) * 3440

    mid_lat = (lat1 + lat2) / 2
    mid_lon = (lon1 + lon2) / 2

    return {
        "dep": dep_icao.upper(),
        "arr": arr_icao.upper(),
        "distance_nm": round(d, 1),
        "route": f"{dep_icao.upper()} → W23 → A470 → {arr_icao.upper()}",
        "note": f"大圆距离约 {round(d)}nm，途经 ({round(mid_lat,2)}, {round(mid_lon,2)})"
    }

# ========== 内存数据库（演示用） ==========
users = {}
events = [
    {"id": 1, "name": "跨年跨洋连飞", "image": "", "description": "从广州飞往东京，跨年特别活动", "status": "未开始"},
    {"id": 2, "name": "华南区内巡游", "image": "", "description": "广州-桂林-南宁绕飞", "status": "未开始"},
]
signups = []
applications = []
announcements = ["欢迎加入弥天翼航空联盟！"]

# ========== 路由 ==========
def handle_request(request):
    url = request.url
    method = request.method
    parsed = urllib.parse.urlparse(url)
    path = parsed.path
    query = urllib.parse.parse_qs(parsed.query)

    # 登录
    if path.endswith("/api/login") and method == "POST":
        data = json.loads(request.body)
        user = users.get(data.get("id", ""))
        if user and user["password"] == data.get("password", ""):
            return Response.json({"success": True})
        return Response.json({"success": False, "message": "用户名或密码错误"})

    # 注册
    if path.endswith("/api/register") and method == "POST":
        data = json.loads(request.body)
        pid = data.get("id", "")
        if not pid.isdigit() or len(pid) != 4:
            return Response.json({"success": False, "message": "ID必须是四位数字"})
        users[pid] = {"email": data.get("email"), "password": data.get("password"), "isAdmin": False}
        return Response.json({"success": True})

    # METAR
    if path.endswith("/api/metar") and method == "GET":
        icao = query.get("icao", ["ZGGG"])[0]
        return Response.new(get_metar(icao), headers={"Content-Type": "text/plain;charset=utf-8"})

    # 航路
    if path.endswith("/api/route") and method == "GET":
        dep = query.get("dep", ["ZGGG"])[0]
        arr = query.get("arr", ["RJTT"])[0]
        result = great_circle_route(dep, arr)
        return Response.json(result)

    # 活动列表
    if path.endswith("/api/events") and method == "GET":
        return Response.json(events)

    # 报名
    if path.endswith("/api/signup") and method == "POST":
        data = json.loads(request.body)
        signups.append(data)
        return Response.json({"success": True})

    # 职员申请
    if path.endswith("/api/apply") and method == "POST":
        data = json.loads(request.body)
        applications.append(data)
        return Response.json({"success": True})

    # 健康检查
    if path.endswith("/api/health"):
        return Response.json({"status": "ok", "service": "弥天翼航空联盟"})

    return Response.json({"error": "Not found"}, status=404)

async def on_fetch(request):
    return handle_request(request)
