from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(String(1000))
    type: Mapped[str] = mapped_column(String(50), default="string")
    category: Mapped[str] = mapped_column(String(50), default="general")
    description: Mapped[str] = mapped_column(String(500), default="")

