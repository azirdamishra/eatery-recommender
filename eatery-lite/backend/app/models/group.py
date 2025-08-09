from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from ..core.database import Base


class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to locations
    locations = relationship("Location", back_populates="group", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Group(id='{self.id}', name='{self.name}')>"
