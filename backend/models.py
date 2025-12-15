from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

class UserSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    
    psychometric_response: Optional["PsychometricResponse"] = Relationship(back_populates="user")
    game_results: List["GameResult"] = Relationship(back_populates="user")

class PsychometricResponse(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="usersession.id")
    # Store answers as a JSON string or simplified format for now
    extraversion_score: int
    agreeableness_score: int
    conscientiousness_score: int
    neuroticism_score: int
    openness_score: int
    
    user: Optional[UserSession] = Relationship(back_populates="psychometric_response")

class GameResult(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="usersession.id")
    game_type: str # "arithmetic", "pathfinding", "key_collection"
    score: int
    time_taken_seconds: float
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    # Pathfinding-specific fields (optional, None for other game types)
    steps_taken: Optional[int] = None
    optimal_steps: Optional[int] = None
    keys_collected: Optional[int] = None
    levels_completed: Optional[int] = None
    
    user: Optional[UserSession] = Relationship(back_populates="game_results")
