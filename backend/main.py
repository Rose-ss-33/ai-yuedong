import os
import json
import math
import tempfile
from typing import List, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
import cv2
import numpy as np
import hashlib
import base64
from datetime import datetime

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://10.223.72.65:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.environ.get("JR_MODEL", "yolov8n-pose.pt")
# 延迟加载模型，避免服务启动时阻塞或失败
_model = None

def get_model():
    global _model
    if _model is None:
        _model = YOLO(MODEL_PATH)
    return _model

STORE_PATH = os.path.join(os.path.dirname(__file__), "data.json")

class AnalyzeResponse(BaseModel):
    count: int
    cadence_spm: float
    avg_height_cm: float
    symmetry_score: float
    misses: int
    frames_analyzed: int
    analysis: List[str] = []
    duration_seconds: float

# 简单的成就门槛
ACHIEVEMENTS = [
    (100, "初级跳绳达人"),
    (500, "中级跳绳达人"),
    (1000, "高级跳绳达人"),
]


def load_store() -> Dict[str, Any]:
    if not os.path.exists(STORE_PATH):
        return {"total_count": 0, "achievements": []}
    try:
        with open(STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"total_count": 0, "achievements": []}


def save_store(store: Dict[str, Any]):
    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(store, f, ensure_ascii=False, indent=2)


# 帐号与密码哈希
def gen_salt() -> str:
    return base64.b64encode(os.urandom(16)).decode()

def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()

# 保证数据结构含用户与分桶
def ensure_store_shape(store: Dict[str, Any]) -> Dict[str, Any]:
    if 'users' not in store:
        store['users'] = {}
    if 'stats' not in store:
        store['stats'] = {}
    return store

# 获取或初始化用户分桶
def get_bucket(store: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    stats = store.get('stats') or {}
    bucket = stats.get(user_id)
    if not bucket:
        bucket = {'total_count': 0, 'achievements': [], 'sessions': []}
        stats[user_id] = bucket
        store['stats'] = stats
    return bucket

# 简化的跳绳计数逻辑：
# - 使用YOLOv8 Pose关键点检测：手腕(9,10)、髋(11,12)、踝(15,16)
# - 依据踝关节的周期性离地+落地作为一次跳绳，结合手腕角速度阈值避免误计
# - 仅分析每隔N帧以提速

def analyze_video(video_path: str) -> AnalyzeResponse:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        cap = cv2.VideoCapture(video_path, cv2.CAP_FFMPEG)
    if not cap.isOpened():
        raise RuntimeError("无法打开视频")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    sample_stride = 3  # 每3帧分析一次
    frames = 0

    left_ankle_y: List[float] = []
    right_ankle_y: List[float] = []
    left_wrist_xy: List[np.ndarray] = []
    right_wrist_xy: List[np.ndarray] = []
    hip_y: List[float] = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        fid = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
        if fid % sample_stride != 0:
            continue
        frames += 1

        results = get_model().predict(frame, imgsz=640, verbose=False)
        if not results:
            continue
        kp = getattr(results[0], "keypoints", None)
        if kp is None:
            continue
        kps_xy = getattr(kp, "xy", None)
        if kps_xy is None:
            continue
        kps = np.array(kps_xy)
        if kps.ndim < 3 or kps.shape[0] < 1 or kps.shape[1] < 17:
            continue
        person = kps[0]
        required_idx = [9, 10, 11, 12, 15, 16]
        if any(i >= person.shape[0] for i in required_idx):
            continue
        lw = person[9]
        rw = person[10]
        lh = person[11]
        rh = person[12]
        la = person[15]
        ra = person[16]
        try:
            _vals = [lw[0], lw[1], rw[0], rw[1], lh[1], rh[1], la[1], ra[1]]
        except Exception:
            continue
        if np.any(np.isnan(_vals)):
            continue

        left_ankle_y.append(float(la[1]))
        right_ankle_y.append(float(ra[1]))
        hip_y.append(float((lh[1] + rh[1]) / 2.0))
        left_wrist_xy.append(np.array([float(lw[0]), float(lw[1])]))
        right_wrist_xy.append(np.array([float(rw[0]), float(rw[1])]))

    cap.release()

    frames_analyzed = len(hip_y)
    if frames_analyzed < 10:
        # 数据不足
        total_seconds = frames_analyzed * (sample_stride / fps)
        resp = AnalyzeResponse(
            count=0,
            cadence_spm=0.0,
            avg_height_cm=0.0,
            symmetry_score=0.0,
            misses=0,
            frames_analyzed=frames_analyzed,
            achievements=[],
            analysis=[],
            duration_seconds=float(total_seconds),
        )
        return resp

    # 建立地面参考：使用最靠下的踝位置的百分位作为地面（更稳健）
    ground_left = np.percentile(left_ankle_y, 90)
    ground_right = np.percentile(right_ankle_y, 90)
    ground = float((ground_left + ground_right) / 2.0)

    # 跳跃事件：当两脚平均y明显高于地面（y值越小越高），并且髋下降（身体上升）
    ankles_y = (np.array(left_ankle_y) + np.array(right_ankle_y)) / 2.0
    hips_y = np.array(hip_y)

    # 估算高度：地面与最低踝的差
    min_ankle = float(np.min(ankles_y))
    avg_height_px = float(ground - min_ankle)
    # 粗略像素到厘米换算（需要标定，这里假定比例系数）
    cm_per_px = 0.1  # 简化假设
    avg_height_cm = max(0.0, avg_height_px * cm_per_px)

    # 手腕角速度近似：使用相邻帧的位移衡量
    def mean_velocity(xy_list: List[np.ndarray]) -> float:
        if len(xy_list) < 2:
            return 0.0
        disps = [np.linalg.norm(xy_list[i] - xy_list[i-1]) for i in range(1, len(xy_list))]
        return float(np.mean(disps))

    lw_speed = mean_velocity(left_wrist_xy)
    rw_speed = mean_velocity(right_wrist_xy)
    symmetry = 1.0 - (abs(lw_speed - rw_speed) / (lw_speed + rw_speed + 1e-6))
    symmetry = max(0.0, min(1.0, symmetry))

    # 通过峰值检测计数跳跃：寻找踝y的局部最小（离地最高）
    y = ankles_y
    window = 3
    minima_idx: List[int] = []
    for i in range(window, len(y) - window):
        segment = y[i-window:i+window+1]
        if y[i] == segment.min():
            # 手腕速度阈值过滤（避免无绳跳或误检）
            if (lw_speed + rw_speed) / 2.0 > 2.0:
                minima_idx.append(i)
    # 去重（防止一个峰附近多次计数）
    filtered_idx: List[int] = []
    min_gap = max(2, int((fps / sample_stride) * 0.3))  # 至少0.3秒间隔
    last = -9999
    for idx in minima_idx:
        if idx - last >= min_gap:
            filtered_idx.append(idx)
            last = idx

    count = len(filtered_idx)

    # 估算节奏：count / 分钟
    total_seconds = frames_analyzed * (sample_stride / fps)
    cadence_spm = (count / total_seconds) * 60.0 if total_seconds > 0 else 0.0

    # 粗略失误：当手腕速度很低但出现跳跃峰，认为可能是绊绳或无效
    misses = 0
    if (lw_speed + rw_speed) / 2.0 < 1.0:
        misses = max(0, count // 10)  # 简化近似

    # 规则化动作建议
    tips: List[str] = []
    if count < 20:
        tips.append("本次跳绳次数较少，可适当延长训练时间。")
    elif count > 100:
        tips.append("跳绳次数较多，注意节奏与呼吸，避免过度疲劳。")

    if cadence_spm < 80:
        tips.append("节奏偏慢，尝试提高绳速并缩小跳跃幅度。")
    elif cadence_spm > 140:
        tips.append("节奏偏快，留意落地缓冲，避免膝踝压力。")

    # 新增：当分析时长≥60秒且节奏≥150 spm，提醒避免过度疲劳
    if total_seconds >= 60 and cadence_spm >= 150:
        tips.append("1分钟内节奏超过150次/分钟，注意避免过度疲劳。")

    if avg_height_cm < 8:
        tips.append("平均高度偏低，尝试脚尖轻跳，保持低幅高频以提高效率。")
    elif avg_height_cm > 15:
        tips.append("跳得过高，能量消耗大且易疲劳，建议降低跳跃高度。")

    if symmetry < 0.7:
        tips.append("左右手摆动不对称，尝试让两侧手腕速度更一致。")
    elif symmetry < 0.85:
        tips.append("对称性一般，可加强双手协调性训练。")

    if misses > 0:
        tips.append("出现失误，建议缩小手腕摆幅并放松肩膀，保证绳子稳定通过足下。")

    if frames_analyzed < 20:
        tips.append("有效帧偏少，建议拍摄更清晰或更长的视频以提升分析准确性。")

    # 存储与成就计算移到接口层按用户ID执行
    return AnalyzeResponse(
        count=count,
        cadence_spm=round(cadence_spm, 1),
        avg_height_cm=round(avg_height_cm, 1),
        symmetry_score=float(symmetry),
        misses=misses,
        frames_analyzed=frames_analyzed,
        analysis=tips,
        duration_seconds=float(total_seconds),
    )


@app.post('/analyze', response_model=AnalyzeResponse)
async def analyze_endpoint(request: Request, file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or '')[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    try:
        resp = analyze_video(tmp_path)
        user_id = request.headers.get('x-user-id') or 'default'
        store = ensure_store_shape(load_store())
        bucket = get_bucket(store, user_id)
        prev_total = int(bucket.get('total_count', 0))
        new_total = prev_total + resp.count
        unlocked: List[str] = []
        for th, name in ACHIEVEMENTS:
            if prev_total < th <= new_total:
                unlocked.append(name)
        bucket['total_count'] = new_total
        ach = set(bucket.get('achievements', []))
        for u in unlocked:
            ach.add(u)
        bucket['achievements'] = list(ach)
        # 记录本次训练
        sessions = bucket.get('sessions') or []
        sessions.append({'time': datetime.utcnow().isoformat() + 'Z', 'count': resp.count, 'duration_seconds': resp.duration_seconds, 'cadence_spm': resp.cadence_spm})
        bucket['sessions'] = sessions
        save_store(store)
        return resp
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Analyze failed: {e}")
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


class StatsResponse(BaseModel):
    total_count: int
    achievements: List[str]
    sessions: List[Dict[str, Any]] = []

@app.get("/stats", response_model=StatsResponse)
def get_stats(request: Request):
    user_id = request.headers.get('x-user-id') or 'default'
    store = ensure_store_shape(load_store())
    bucket = get_bucket(store, user_id)
    return StatsResponse(
        total_count=int(bucket.get('total_count', 0)),
        achievements=list(bucket.get('achievements', [])),
        sessions=list(bucket.get('sessions', [])),
    )

@app.post("/stats/reset", response_model=StatsResponse)
def reset_stats(request: Request):
    user_id = request.headers.get('x-user-id') or 'default'
    store = ensure_store_shape(load_store())
    bucket = get_bucket(store, user_id)
    # 重置累计与成就，保留训练记录
    bucket['total_count'] = 0
    bucket['achievements'] = []
    save_store(store)
    return StatsResponse(
        total_count=0,
        achievements=[],
        sessions=list(bucket.get('sessions', [])),
    )

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    user_id: str

@app.post('/login', response_model=LoginResponse)
def login(req: LoginRequest):
    store = ensure_store_shape(load_store())
    users = store.get('users') or {}
    u = users.get(req.username)
    if not u:
        raise HTTPException(status_code=401, detail="用户不存在或密码错误")
    if u.get('password_hash') != hash_password(req.password, u.get('salt') or ''):
        raise HTTPException(status_code=401, detail="用户不存在或密码错误")
    # 保证分桶存在
    get_bucket(store, req.username)
    save_store(store)
    return LoginResponse(user_id=req.username)

class RegisterRequest(BaseModel):
    username: str
    password: str

@app.post('/register', response_model=LoginResponse)
def register(req: RegisterRequest):
    store = ensure_store_shape(load_store())
    users = store.get('users') or {}
    if req.username in users:
        raise HTTPException(status_code=400, detail="用户名已存在")
    salt = gen_salt()
    users[req.username] = {'salt': salt, 'password_hash': hash_password(req.password, salt)}
    store['users'] = users
    # 初始化分桶
    get_bucket(store, req.username)
    save_store(store)
    return LoginResponse(user_id=req.username)


def save_store(store: Dict[str, Any]):
    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(store, f, ensure_ascii=False, indent=2)

@app.get("/")
def health():
    return {"ok": True}