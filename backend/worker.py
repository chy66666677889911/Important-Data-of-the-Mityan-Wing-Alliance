# backend/worker.py
# Cloudflare Python Worker - 弥天翼航空联盟后端
# 依赖：无第三方库，纯标准库

import json
import urllib.request
import urllib.parse
import math
from js import Response

# ========== 工具函数 ==========

def fetch_json(url, timeout=5):
    """发送 GET 请求并返回 JSON"""
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"error": str(e)}

def fetch_text(url, timeout=5):
    """发送 GET 请求并返回纯文本"""
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.read().decode().strip()
    except Exception as e:
        return f"获取失败: {e}"

# ========== METAR / 机场信息 ==========

def get_metar(icao):
    """从 AviationWeather.gov 获取 METAR 原始报文"""
    url = f"https://aviationweather.gov/api/data/metar?ids={icao.upper()}&format=raw&taf=false&hours=1"
    return fetch_text(url)

def get_station_info(icao):
    """获取机场坐标和基本信息"""
    url = f"https://aviationweather.gov/api/data/stationinfo?ids={icao.upper()}"
    data = fetch_json(url)
    if isinstance(data, list) and len(data) > 0:
        return data[0]
    return None

# ========== 伪航路（大圆算法） ==========

def deg2rad(d):
    return d * math.pi / 180

def rad2deg(r):
    return r * 180 / math.pi

def great_circle_route(dep_icao, arr_icao):
    """
    用大圆算法生成伪航路描述
    实际连飞够用，后期可接 Flight Plan Database
    """
    dep = get_station_info(dep_icao)
    arr = get_station_info(arr_icao)
    if not dep or not arr:
        return "机场信息获取失败，请检查 ICAO 代码"

    # 提取坐标
    lat1, lon1 = float(dep.get("lat", 0)), float(dep.get("lon", 0))
    lat2, lon2 = float(arr.get("lat", 0)), float(arr.get("lon", 0))

    # 大圆距离（海里，用球面余弦公式简化）
    rlat1, rlon1 = deg2rad(lat1), deg2rad(lon1)
    rlat2, rlon2 = deg2rad(lat2), deg2rad(lon2)
    d = math.acos(
        math.sin(rlat1) * math.sin(rlat2) +
        math.cos(rlat1) * math.cos(rlat2) * math.cos(rlon2 - rlon1)
    ) * 3440  # 地球半径约3440海里

    # 取大圆中点作为"途经点"示意
    mid_lat = (lat1 + lat2) / 2
    mid_lon = (lon1 + lon2) / 2

    return {
        "dep": dep_icao.upper(),
        "arr": arr_icao.upper(),
        "distance_nm": round(d, 1),
        "route": f"{dep_icao.upper()} → W23 → A470 → {arr_icao.upper()}",
        "note": f"大圆距离约 {round(d)}nm，途经 ({round(mid_lat,2)}, {round(mid_lon,2)})"
    }

# ========== 路由分发 ==========

def handle_request(request):
    url = request.url
    method = request.method
    path = urllib.parse.urlparse(url).path
    query = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)

    # ---- METAR 查询 ----
    if path.endswith("/api/metar") and method == "GET":
        icao = query.get("icao", ["ZGGG"])[0]
        metar = get_metar(icao)
        return Response.new(metar, headers={"Content-Type": "text/plain;charset=utf-8"})

    # ---- 航路查询 ----
    if path.endswith("/api/route") and method == "GET":
        dep = query.get("dep", ["ZGGG"])[0]
        arr = query.get("arr", ["RJTT"])[0]
        result = great_circle_route(dep, arr)
        return Response.json(result)

    # ---- 机场信息（给前端查附近用）----
    if path.endswith("/api/station") and method == "GET":
        icao = query.get("icao", ["ZGGG"])[0]
        info = get_station_info(icao)
        if info:
            return Response.json(info)
        return Response.json({"error": "未找到机场"}, status=404)

    # ---- 健康检查 ----
    if path.endswith("/api/health"):
        return Response.json({"status": "ok", "service": "弥天翼航空联盟"})

    # ---- 404 ----
    return Response.json({"error": "Not found", "path": path}, status=404)

# ========== Cloudflare Worker 入口 ==========
async def on_fetch(request):
    return handle_request(request)
