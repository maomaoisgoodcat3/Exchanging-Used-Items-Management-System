from fastapi import FastAPI
from app.api.v1 import auth

app = FastAPI(title='UET Marketplace API')

# Đăng ký module Auth vào ứng dụng tổng
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])

@app.get('/')
def read_root():
    return {'message': 'Welcome to UET Marketplace API'}