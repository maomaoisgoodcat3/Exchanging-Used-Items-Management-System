# app/api/v1/upload.py
from fastapi import APIRouter, UploadFile, File
import os
import shutil
import uuid

router = APIRouter(prefix="/api/v1/upload", tags=["Upload"])

# Tạo thư mục static/uploads ở thư mục gốc của dự án nếu chưa có
UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_image_local(file: UploadFile = File(...)):
    """Lưu ảnh vào thư mục local của Server và trả về URL"""
    try:
        # Lấy đuôi file (vd: .jpg, .png) và tạo tên ngẫu nhiên để không bị trùng
        file_extension = file.filename.split(".")[-1]
        new_filename = f"{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, new_filename)
        
        # Copy file từ request vào ổ cứng
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Trả về URL nội bộ. Lát nữa ta sẽ cấu hình mở public thư mục "/static"
        return {"url": f"http://localhost:8000/static/uploads/{new_filename}"}
        
    except Exception as e:
        return {"error": str(e)}