from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from database import create_db_and_tables, get_session
from models import UserSession, PsychometricResponse, GameResult
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

origins = [
    "http://localhost:5173",  # React default port
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for simplicity in dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # Wait for DB to be ready in production, here we assume it enters retry loop if needed or just works
    # In docker-compose, depends_on handles startup order but not readiness.
    # SQLModel create_all might fail if DB isn't ready. 
    # For now, we'll try to create tables on first request or let docker restart handling handle it.
    try:
        create_db_and_tables()
    except Exception as e:
        print(f"Error creating tables: {e}")

@app.get("/")
def read_root():
    return {"message": "Gamified Assessment API"}

class UserCreate(BaseModel):
    username: str

@app.post("/api/register")
def register_user(user: UserCreate, session: Session = Depends(get_session)):
    db_user = UserSession(username=user.username)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

class PsychometricSubmit(BaseModel):
    user_id: int
    scores: dict # { "extraversion": 5, ... }

@app.post("/api/submit_psychometric")
def submit_psychometric(data: PsychometricSubmit, session: Session = Depends(get_session)):
    response = PsychometricResponse(
        user_id=data.user_id,
        extraversion_score=data.scores.get("extraversion", 0),
        agreeableness_score=data.scores.get("agreeableness", 0),
        conscientiousness_score=data.scores.get("conscientiousness", 0),
        neuroticism_score=data.scores.get("neuroticism", 0),
        openness_score=data.scores.get("openness", 0),
    )
    session.add(response)
    session.commit()
    return {"status": "success"}

class GameSubmit(BaseModel):
    user_id: int
    game_type: str
    score: int
    time_taken: float
    # Optional pathfinding-specific fields
    steps_taken: Optional[int] = None
    optimal_steps: Optional[int] = None
    keys_collected: Optional[int] = None
    levels_completed: Optional[int] = None

@app.post("/api/submit_game")
def submit_game(data: GameSubmit, session: Session = Depends(get_session)):
    result = GameResult(
        user_id=data.user_id,
        game_type=data.game_type,
        score=data.score,
        time_taken_seconds=data.time_taken,
        steps_taken=data.steps_taken,
        optimal_steps=data.optimal_steps,
        keys_collected=data.keys_collected,
        levels_completed=data.levels_completed
    )
    session.add(result)
    session.commit()
    return {"status": "success"}

@app.get("/api/leaderboard")
def get_leaderboard(session: Session = Depends(get_session)):
    # Simple leaderboard: sum of all game scores per user
    # optimized implementation would be aggregation in SQL
    users = session.exec(select(UserSession)).all()
    leaderboard = []
    for user in users:
        total_score = sum([r.score for r in user.game_results])
        leaderboard.append({
            "username": user.username,
            "total_score": total_score
        })
    return sorted(leaderboard, key=lambda x: x['total_score'], reverse=True)
