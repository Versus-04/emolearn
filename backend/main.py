# ============================================================
# EMOTION-AWARE COURSES BACKEND v3
# Full integration: Auto-generated lessons + LLM analysis + ML + Gamification
# ============================================================

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import uuid, random, json, os
from datetime import datetime, timedelta

from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from passlib.context import CryptContext
from jose import jwt, JWTError
from dotenv import load_dotenv
from openai import OpenAI

from ml_inference import predict_burnout_ml, get_feature_importance

# ============================================================
# CONFIG
# ============================================================

load_dotenv()
SECRET_KEY = "CHANGE_THIS_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "emotion_learning.db")
DATABASE_URL = "sqlite:///./emotion_learning.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine,expire_on_commit=False)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
    default_headers={
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Emotion-Aware-Learning"
    }
)
model_path = os.path.join(BASE_DIR, "burnout_model.pkl")
scaler_path = os.path.join(BASE_DIR, "burnout_scaler.pkl")
if not os.path.exists(model_path) or not os.path.exists(scaler_path):
    raise Exception("ML model files not found. Please run the training script first.")
app = FastAPI(title="Emotion-Aware Coursera-Style Learning Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

# ============================================================
# DATABASE MODELS
# ============================================================

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True)
    name=Column(String,nullable=True)
    password = Column(String)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak = Column(Integer, default=0)
    last_active = Column(DateTime, nullable=True)
    experiment_group = Column(String)

class Course(Base):
    __tablename__ = "courses"
    id = Column(String, primary_key=True)
    title = Column(String)
    description = Column(Text)
    category = Column(String)
    difficulty = Column(String)

class Module(Base):
    __tablename__ = "modules"
    id = Column(String, primary_key=True)
    course_id = Column(String)
    title = Column(String)
    description = Column(Text)
    order = Column(Integer)

class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(String, primary_key=True)
    module_id = Column(String)
    title = Column(String)
    content = Column(Text)
    order = Column(Integer)
    difficulty = Column(String)

class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(String, primary_key=True)
    lesson_id = Column(String)
    question = Column(Text)
    options = Column(Text)
    correct_answer = Column(String)
    type = Column(String, default="MCQ")
    hint = Column(Text, default="")

class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(String, primary_key=True)
    user_id = Column(String)
    lesson_id = Column(String)
    completed = Column(Integer, default=0)
    score = Column(Float, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)

class LearningSession(Base):
    __tablename__ = "learning_sessions"
    id = Column(String, primary_key=True)
    user_id = Column(String)
    topic = Column(String)
    difficulty = Column(String)
    accuracy = Column(Float)
    response_time = Column(Float)
    stress_level = Column(Float)
    engagement_score = Column(Float)
    confidence_level = Column(Float)
    burnout_risk_ml = Column(Float)
    dropout_probability = Column(Float)
    emotional_state = Column(String)
    psychological_insight = Column(Text)
    ai_feedback = Column(Text)
    xp_earned = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Badge(Base):
    __tablename__ = "badges"
    id = Column(String, primary_key=True)
    user_id = Column(String)
    name = Column(String)
    unlocked_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# ============================================================
# AUTH HELPERS
# ============================================================

def hash_password(password): return pwd_context.hash(password)
def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)

def create_token(user_id: str):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"user_id": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["user_id"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
@app.get("/profile")
def get_profile(user_id: str = Depends(get_current_user)):
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    db.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "name": user.name,
        "email": user.email,
        "xp": user.xp,
        "level": user.level,
        "streak": user.streak
    }
# ============================================================
# REQUEST MODELS
# ============================================================

class RegisterRequest(BaseModel):
    email: str
    password: str
    name:str

class LoginRequest(BaseModel):
    email: str
    password: str

class ExerciseSubmitRequest(BaseModel):
    lesson_id: str
    answers: dict

class GenerateCourseRequest(BaseModel):
    course_title: str
    category: str
    difficulty: str
    num_modules: int = 3
    lessons_per_module: int = 3

class LearningRequest(BaseModel):
    topic: str
    difficulty: str
    accuracy: float
    response_time: float
    stress_level: float

# ============================================================
# AUTH ROUTES
# ============================================================

@app.post("/register")
def register(data: RegisterRequest):
    db = SessionLocal()
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email exists")
    user = User(id=str(uuid.uuid4()), email=data.email, name=data.name,password=hash_password(data.password),
                experiment_group=random.choice(["A","B"]))
    db.add(user)
    db.commit()
    db.close()
    return {"message": "Registered successfully"}

@app.post("/login")
def login(data: LoginRequest):
    db = SessionLocal()
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.id)
    db.close()
    return {"access_token": token,"name":user.name,"email":user.email,"xp":user.xp,"level":user.level,"streak":user.streak}
# ============================================================
# AUTO-GENERATE COURSES WITH LLM
# ============================================================

@app.post("/generate_course")
def generate_course(data: GenerateCourseRequest):
    db = SessionLocal()
    course = Course(
    id=str(uuid.uuid4()), title=data.course_title,
    description=f"A comprehensive {data.difficulty.lower()} course on {data.course_title}. Learn through structured lessons, real-world examples, and hands-on assessments — just like Coursera.",
    category=data.category, difficulty=data.difficulty
)
    db.add(course)
    db.commit()
    
    for m_index in range(1, data.num_modules + 1):
        module_prompt = f"""Return ONLY a JSON object. No markdown, no extra text.
For a {data.difficulty} course titled "{data.course_title}", generate a title and description for Module {m_index} of {data.num_modules}.
Return: {{"title": "descriptive module title", "description": "2 sentence description of what this module covers"}}"""

        try:
            mod_resp = client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[{"role":"user","content":module_prompt}]
            )
            mod_raw = mod_resp.choices[0].message.content.strip()
            if "```" in mod_raw:
                parts = mod_raw.split("```")
                for part in parts:
                    part = part.strip()
                    if part.startswith("json"): part = part[4:].strip()
                    if part.startswith("{"): mod_raw = part; break
            mod_json = json.loads(mod_raw)
            module_title = mod_json.get("title", f"Module {m_index}")
            module_desc  = mod_json.get("description", f"Module {m_index} of {data.course_title}")
        except Exception as e:
            print(f"Module title error: {e}")
            module_title = f"Module {m_index}: {data.course_title}"
            module_desc  = f"Module {m_index} covering key concepts of {data.course_title}"

        module = Module(
            id=str(uuid.uuid4()), course_id=course.id,
            title=module_title, description=module_desc,
            order=m_index
        )
        db.add(module)
        db.commit()

        for l_index in range(1, data.lessons_per_module + 1):
            lesson_prompt = f"""You are an expert course creator for a platform like Coursera. Return ONLY a raw JSON object. No markdown, no code fences, no extra text whatsoever.

Create a professional, detailed lesson for:
Course: "{data.course_title}"
Module: {m_index} of {data.num_modules}
Lesson: {l_index} of {data.lessons_per_module}
Difficulty: {data.difficulty}

The lesson must feel like a real Coursera lesson — structured, educational, engaging, with real examples.

Return exactly this JSON:
{{
  "title": "specific descriptive lesson title",
  "content": "MINIMUM 600 words. Structure the content like this:\\n\\n## Overview\\nBrief intro to what this lesson covers and why it matters.\\n\\n## Core Concepts\\nExplain the main theory with depth. Use real-world analogies. Break into sub-points.\\n\\n## Detailed Explanation\\nGo deeper. Explain how it works step by step. Include code snippets or formulas if relevant.\\n\\n## Real-World Examples\\nGive 2-3 concrete real-world examples of this concept in use.\\n\\n## Key Takeaways\\n- Bullet point 1\\n- Bullet point 2\\n- Bullet point 3\\n\\n## What is Next\\nBrief preview of the next lesson.",
  "exercises": [
    {{"question": "Conceptual question testing deep understanding of {data.course_title}","options": ["Option A","Option B","Option C","Option D"],"answer": "Option A","hint": "Think about the Overview section","type": "MCQ"}},
    {{"question": "Application question — how would you use this concept in practice?","options": ["Option A","Option B","Option C","Option D"],"answer": "Option B","hint": "Refer to Real-World Examples","type": "MCQ"}},
    {{"question": "Scenario-based question testing practical knowledge","options": ["Option A","Option B","Option C","Option D"],"answer": "Option C","hint": "Think about Detailed Explanation","type": "MCQ"}},
    {{"question": "Which of the following statements about this topic is correct?","options": ["Option A","Option B","Option C","Option D"],"answer": "Option D","hint": "Review Key Takeaways","type": "MCQ"}},
    {{"question": "Advanced question connecting all concepts in this lesson","options": ["Option A","Option B","Option C","Option D"],"answer": "Option A","hint": "Think about how all concepts connect","type": "MCQ"}},
    {{"question": "What would happen if this concept was applied incorrectly?","options": ["Option A","Option B","Option C","Option D"],"answer": "Option B","hint": "Think about consequences described in the lesson","type": "MCQ"}},
    {{"question": "Which real-world scenario best demonstrates this concept?","options": ["Option A","Option B","Option C","Option D"],"answer": "Option C","hint": "Recall the Real-World Examples section","type": "MCQ"}},
    {{"question": "Beginner-friendly question — what is the core idea of this lesson?","options": ["Option A","Option B","Option C","Option D"],"answer": "Option D","hint": "Re-read the Overview section","type": "MCQ"}},
    {{"question": "Comparison question — how does this differ from related concepts?","options": ["Option A","Option B","Option C","Option D"],"answer": "Option A","hint": "Think about Core Concepts section","type": "MCQ"}},
    {{"question": "Final challenge — synthesise everything you learned in this lesson","options": ["Option A","Option B","Option C","Option D"],"answer": "Option B","hint": "Review the entire lesson from top to bottom","type": "MCQ"}}
]
}}

CRITICAL RULES:
- answer must be the EXACT string of one of the options, character for character
- content must have ALL sections: Overview, Core Concepts, Detailed Explanation, Real-World Examples, Key Takeaways, What is Next
- options must all be plausible — no obviously wrong answers
- questions must test understanding of THIS specific lesson content
- Return ONLY the JSON object, absolutely nothing else"""             
            response = client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[{"role":"user","content":lesson_prompt}]
            )
            try:
                raw = response.choices[0].message.content.strip()
                print("RAW:", raw[:200])
    # Strip markdown code fences if present
                if raw.startswith("```"):
                    raw = raw.split("```")[1]
                    if raw.startswith("json"):
                        raw = raw[4:]
                raw = raw.strip()
                lesson_json = json.loads(raw)
                lesson = Lesson(
                    id=str(uuid.uuid4()), module_id=module.id,
                    title=lesson_json.get("title", f"Lesson {l_index}"),
                    content=lesson_json.get("content", "Content unavailable"),
                    order=l_index, difficulty=data.difficulty
                )
                db.add(lesson)
                db.commit()

                for ex in lesson_json.get("exercises", []):
                    exercise = Exercise(
                        id=str(uuid.uuid4()), lesson_id=lesson.id,
                        question=ex.get("question"),
                        options=json.dumps(ex.get("options", [])),
                        correct_answer=ex.get("answer"),
                        type=ex.get("type","MCQ"),
                        hint=ex.get("hint","")
                    )
                    db.add(exercise)
                db.commit()
            except:
                continue
            
            print("RAW LLM RESPONSE:", response.choices[0].message.content)
    db.close()
    return {"message": f"Course '{data.course_title}' generated successfully!"}


# ============================================================
# COURSE CONTENT ROUTES
# ============================================================

@app.get("/courses")
def get_courses():
    db = SessionLocal()
    courses = db.query(Course).all()
    db.close()
    return [{"id":c.id,"title":c.title,"description":c.description,"difficulty":c.difficulty} for c in courses]

@app.get("/modules/{course_id}")
def get_modules(course_id: str):
    db = SessionLocal()
    modules = db.query(Module).filter(Module.course_id==course_id).order_by(Module.order).all()
    db.close()
    return [{"id":m.id,"title":m.title,"description":m.description,"order":m.order} for m in modules]

@app.get("/lessons/{module_id}")
def get_lessons(module_id: str):
    db = SessionLocal()
    lessons = db.query(Lesson).filter(Lesson.module_id==module_id).order_by(Lesson.order).all()
    db.close()
    return [{"id":l.id,"title":l.title,"content":l.content,"difficulty":l.difficulty,"order":l.order} for l in lessons]

@app.get("/exercises/{lesson_id}")
def get_exercises(lesson_id: str):
    db = SessionLocal()
    exercises = db.query(Exercise).filter(Exercise.lesson_id==lesson_id).all()
    db.close()
    return [{"id":e.id,"question":e.question,"options":json.loads(e.options),"type":e.type,"hint":e.hint} for e in exercises]

# ============================================================
# SUBMIT EXERCISES & LEARNING SESSION (With LLM + ML)
# ============================================================

def compute_engagement(acc, rt, stress):
    return round((acc*0.5) + ((1-stress)*0.3) + (1/(rt+1)*0.2), 3)

def compute_xp(acc, difficulty, engagement):
    multiplier = {"Easy":1,"Medium":1.5,"Hard":2}
    return int(10*multiplier.get(difficulty,1)*acc*engagement)

def compute_dropout(engagement):
    return round(1 - engagement,2)

def safe_json_parse(response_text):
    try:
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        return json.loads(response_text[start:end])
    except:
        return {"emotion":"Neutral","confidence_level":0.5,"psychological_insight":"Fallback response"}

@app.post("/submit_lesson")
def submit_lesson(data: LearningRequest, user_id: str = Depends(get_current_user)):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        engagement = compute_engagement(data.accuracy, data.response_time, data.stress_level)
        confidence = round(random.uniform(0.4, 0.9), 2)
        burnout    = predict_burnout_ml([data.accuracy, data.stress_level, engagement, confidence, data.response_time])
        dropout    = compute_dropout(engagement)
        xp         = compute_xp(data.accuracy, data.difficulty, engagement)

        today = datetime.utcnow().date()
        if user.last_active:
            diff = (today - user.last_active.date()).days
            if diff == 1:  user.streak += 1
            elif diff > 1: user.streak = 1
        else:
            user.streak = 1
        user.last_active = datetime.utcnow()
        user.xp   += xp
        user.level = int(user.xp / 100) + 1

        if user.streak >= 7:
            if not db.query(Badge).filter_by(user_id=user.id, name="Consistency Master").first():
                db.add(Badge(id=str(uuid.uuid4()), user_id=user.id, name="Consistency Master"))

        # LLM emotion — never crashes the endpoint
        parsed = {"emotion": "Neutral", "confidence_level": confidence, "psychological_insight": "Keep learning!"}
        ai_feedback = None
        try:
            emotion_prompt = f"""Return ONLY valid JSON, no markdown, no extra text.
Analyze this learner's emotional state:
- Accuracy: {data.accuracy}
- Stress level: {data.stress_level}
- Engagement: {engagement}
- Confidence: {confidence}

Return exactly: {{"emotion":"Happy|Focused|Neutral|Anxious|Stressed|Confused|Tired|Excited","confidence_level":{confidence},"psychological_insight":"one sentence insight"}}"""
            resp = client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[{"role": "user", "content": emotion_prompt}]
            )
            raw = resp.choices[0].message.content.strip()
            if "```" in raw:
                raw = raw.split("```")[1]
                if raw.startswith("json"): raw = raw[4:]
            parsed = safe_json_parse(raw)
        except Exception as e:
            print("Emotion LLM error:", e)

        try:
            if confidence < 0.6 or burnout > 0.7:
                feedback_prompt = f"""Give 2-3 sentences of motivational feedback for a student who feels {parsed['emotion']} with burnout risk {round(burnout*100)}%."""
                fb = client.chat.completions.create(
                    model="openai/gpt-4o-mini",
                    messages=[{"role": "user", "content": feedback_prompt}]
                )
                ai_feedback = fb.choices[0].message.content
        except Exception as e:
            print("Feedback LLM error:", e)

        session = LearningSession(
            id=str(uuid.uuid4()), user_id=user.id,
            topic=data.topic, difficulty=data.difficulty,
            accuracy=data.accuracy, response_time=data.response_time,
            stress_level=data.stress_level, engagement_score=engagement,
            confidence_level=parsed.get("confidence_level", confidence),
            burnout_risk_ml=burnout, dropout_probability=dropout,
            emotional_state=parsed.get("emotion", "Neutral"),
            psychological_insight=parsed.get("psychological_insight", ""),
            ai_feedback=ai_feedback, xp_earned=xp
        )
        db.add(session)
        db.commit()

        return {
            "xp":                    xp,
            "level":                 user.level,
            "streak":                user.streak,
            "burnout":               burnout,
            "emotional_state":       parsed.get("emotion", "Neutral"),
            "psychological_insight": parsed.get("psychological_insight", ""),
            "ai_feedback":           ai_feedback,
        }
    except Exception as e:
        db.rollback()
        print("submit_lesson ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# ============================================================
# WELLNESS CHECK
# ============================================================

@app.get("/wellness_check")
def wellness_check(user_id: str = Depends(get_current_user)):
    db = SessionLocal()
    last = db.query(LearningSession).filter(LearningSession.user_id==user_id)\
            .order_by(LearningSession.timestamp.desc()).first()
    db.close()
    if not last: return {"status":"No sessions yet"}
    if last.burnout_risk_ml>0.7:
        return {"take_break":True,"reason":"High burnout risk","suggestion":"5-minute breathing"}
    if last.engagement_score<0.4:
        return {"take_break":True,"reason":"Low engagement","suggestion":"Short interactive quiz"}
    return {"take_break":False}

# ============================================================
# RECOMMENDATION
# ============================================================

@app.get("/recommend_next")
def recommend_next(user_id: str = Depends(get_current_user)):
    db = SessionLocal()
    last = db.query(LearningSession).filter(LearningSession.user_id==user_id)\
            .order_by(LearningSession.timestamp.desc()).first()
    db.close()
    if not last: return {"recommendation":"Beginner Lesson"}
    if last.burnout_risk_ml>0.7: return {"recommendation":"Micro Practice Mode"}
    if last.confidence_level<0.4: return {"recommendation":"Revision Mode"}
    if last.engagement_score>0.8: return {"recommendation":"Advanced Challenge"}
    return {"recommendation":"Standard Lesson"}

# ============================================================
# BADGES
# ============================================================

@app.get("/badges")
def get_badges(user_id: str = Depends(get_current_user)):
    db = SessionLocal()
    badges = db.query(Badge).filter(Badge.user_id==user_id).all()
    db.close()
    return [{"name":b.name,"unlocked_at":b.unlocked_at} for b in badges]

# ============================================================
# MODEL EXPLAINABILITY
# ============================================================

@app.get("/explain_model")
def explain_model():
    return get_feature_importance()

# ============================================================
# ADMIN STATS
# ============================================================

@app.get("/admin_stats")
def admin_stats():
    db = SessionLocal()
    users = db.query(User).count()
    sessions = db.query(LearningSession).count()
    db.close()
    return {"total_users":users,"total_sessions":sessions}

# ============================================================
# ROOT
# ============================================================

@app.get("/")
def home():
    return {"status":"Emotion-Aware Coursera-Style Learning Backend 🚀"}

@app.post("/mentor_chat")
def mentor_chat(data: dict):
    try:
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful AI learning mentor."},
                {"role": "user", "content": data.get("message")}
            ]
        )

        return {
            "reply": response.choices[0].message.content
        }

    except Exception as e:
        return {"error": str(e)}
    