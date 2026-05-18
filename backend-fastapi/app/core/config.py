import os
from dotenv import load_dotenv

# Tìm đường dẫn gốc của thư mục backend-fastapi
# (__file__ là config.py -> lùi 1 cấp ra core -> lùi 1 cấp ra app -> lùi 1 cấp ra backend-fastapi)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
env_path = os.path.join(BASE_DIR, ".env")

# Bắt buộc load file .env từ đường dẫn tuyệt đối này
load_dotenv(env_path)

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "0comatkhau")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

settings = Settings()