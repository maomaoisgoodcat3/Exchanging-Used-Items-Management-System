"""User & Organization Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.schemas.user_schema import (
    UserUpdate, UserChangePassword, UserRead, TokenResponse,
    DirectoryBase, OrganizationCreate, OrganizationRead, OrganizationMemberRead
)

from app.core.database import get_db
from app.services.auth_svc import get_current_user

# Sử dụng Models chuẩn xác
from app.models.user import User, Organization, OrganizationMember, Directory
from app.models.campaign import Campaign
from app.core.security import verify_password, get_password_hash

router = APIRouter(prefix="/api/v1/users", tags=["Users & Organizations"])

# ==========================================
# 1. INLINE SCHEMAS (Giữ từ nhánh HEAD)
# ==========================================
class MemberAddRequest(BaseModel):
    user_email: EmailStr

class MemberRoleUpdate(BaseModel):
    permission: str # Manager, Poster, Member

class OrgUpdateDescription(BaseModel):
    description: str


# ==========================================
# 2. API QUẢN LÝ HỒ SƠ (PROFILE)
# ==========================================

@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Lấy thông tin cá nhân (Tab Account)"""
    return {
        "email": current_user.email,
        "name": current_user.name,
        "phone": current_user.phone,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        "created_at": current_user.created_at
    }


@router.put("/me")
def update_my_profile(data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Cập nhật thông tin cá nhân (DB Thật)"""
    if data.name:
        current_user.name = data.name
    if data.phone:
        current_user.phone = data.phone
    db.commit()
    return {"message": "Cập nhật thông tin thành công!"}


@router.get("/directory/list")
def get_directory(
    member_type: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db)
):
    """Get master directory of students/staff (DB Thật)"""
    query = db.query(Directory)
    if member_type:
        query = query.filter(Directory.member_type == member_type)
        
    directories = query.offset(skip).limit(limit).all()
    return [{
        "email": d.email, 
        "fullname": d.fullname, 
        "member_type": d.member_type.value if hasattr(d.member_type, 'value') else str(d.member_type)
    } for d in directories]


@router.get("/{email}")
def get_user_profile(email: str, db: Session = Depends(get_db)):
    """Get specific user's public profile (DB Thật)"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
    return {
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "created_at": user.created_at
    }


@router.post("/change-password")
def change_password(data: UserChangePassword, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Đổi mật khẩu (API của Team)"""
    # 1. Kiểm tra mật khẩu cũ
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mật khẩu cũ không chính xác!")
        
    # 2. Cập nhật
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Đổi mật khẩu thành công!"}


# ==========================================
# 3. API QUẢN LÝ TỔ CHỨC (ORGANIZATIONS)
# ==========================================

@router.get("/my-organizations")
def get_my_organizations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Lấy danh sách Tổ chức User đang tham gia kèm Thống kê"""
    memberships = db.query(OrganizationMember).filter(OrganizationMember.mem_email == current_user.email).all()
    
    org_list = []
    for mem in memberships:
        org = db.query(Organization).filter(Organization.org_email == mem.org_email).first()
        if org:
            campaign_count = db.query(Campaign).filter(Campaign.org_email == org.org_email, Campaign.approval == "Approved").count()
            member_count = db.query(OrganizationMember).filter(OrganizationMember.org_email == org.org_email).count()
            
            org_list.append({
                "org_email": org.org_email,
                "org_name": org.org_name,
                "representative_email": org.representative_email,
                "my_permission": mem.mem_permission.value if hasattr(mem.mem_permission, 'value') else str(mem.mem_permission),
                "total_members": member_count,
                "total_campaigns": campaign_count
            })
    return org_list


@router.post("/organizations", status_code=status.HTTP_201_CREATED)
def create_organization(data: OrganizationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Tạo Tổ chức mới (Người tạo tự động thành Manager)"""
    existing_org = db.query(Organization).filter(Organization.org_email == data.org_email).first()
    if existing_org:
        raise HTTPException(status_code=400, detail="Email Tổ chức này đã được sử dụng")

    # 1. Tạo Tổ chức
    new_org = Organization(
        org_email=data.org_email,
        org_name=data.org_name,
        representative_email=current_user.email,
        description=data.description
    )
    db.add(new_org)
    
    # 2. Thêm người tạo vào làm Manager
    new_member = OrganizationMember(
        org_email=data.org_email,
        mem_email=current_user.email,
        mem_permission="Manager"
    )
    db.add(new_member)
    db.commit()
    
    return {
        "message": "Organization created successfully",
        "organization": {
            "org_email": new_org.org_email,
            "org_name": new_org.org_name,
            "representative_email": new_org.representative_email,
            "description": new_org.description
        }
    }


@router.get("/organizations/{org_email}")
def get_organization_detail(org_email: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Xem chi tiết 1 Tổ chức & List Thành viên (Xếp Manager -> Poster -> Member)"""
    org = db.query(Organization).filter(Organization.org_email == org_email).first()
    if not org:
        raise HTTPException(status_code=404, detail="Không tìm thấy Tổ chức")

    memberships = db.query(OrganizationMember).filter(OrganizationMember.org_email == org_email).all()
    
    # Map ưu tiên xếp hạng
    role_priority = {"Manager": 1, "Poster": 2, "Member": 3}
    
    member_list = []
    for m in memberships:
        user_info = db.query(User).filter(User.email == m.mem_email).first()
        perm_val = m.mem_permission.value if hasattr(m.mem_permission, 'value') else str(m.mem_permission)
        member_list.append({
            "email": m.mem_email,
            "name": user_info.name if user_info else "Unknown",
            "permission": perm_val,
            "priority": role_priority.get(perm_val, 4)
        })
        
    member_list.sort(key=lambda x: x["priority"])

    return {
        "org_info": {
            "org_email": org.org_email,
            "org_name": org.org_name,
            "description": org.description,
            "representative_email": org.representative_email
        },
        "members": member_list
    }


@router.put("/organizations/{org_email}")
def update_organization_info(
    org_email: str,
    data: OrgUpdateDescription,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Người đại diện (Manager) chỉnh sửa Description của Tổ chức"""
    manager_check = db.query(OrganizationMember).filter(
        OrganizationMember.org_email == org_email,
        OrganizationMember.mem_email == current_user.email,
        OrganizationMember.mem_permission == "Manager"
    ).first()
    
    if not manager_check:
        raise HTTPException(status_code=403, detail="Chỉ Manager mới có quyền chỉnh sửa thông tin Tổ chức!")

    org = db.query(Organization).filter(Organization.org_email == org_email).first()
    org.description = data.description
    db.commit()
    
    return {"message": "Cập nhật mô tả Tổ chức thành công!"}


@router.get("/organizations/{org_email}/members")
def get_organization_members(
    org_email: str,
    limit: int = 50,
    skip: int = 0,
    db: Session = Depends(get_db)
):
    """Get members of an organization (API dự phòng của Team)"""
    memberships = db.query(OrganizationMember).filter(OrganizationMember.org_email == org_email).offset(skip).limit(limit).all()
    return [{
        "mem_email": m.mem_email,
        "mem_permission": m.mem_permission.value if hasattr(m.mem_permission, 'value') else str(m.mem_permission)
    } for m in memberships]


@router.post("/organizations/{org_email}/members")
def add_organization_member(
    org_email: str, 
    data: MemberAddRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Manager thêm thành viên mới"""
    manager_check = db.query(OrganizationMember).filter(
        OrganizationMember.org_email == org_email,
        OrganizationMember.mem_email == current_user.email,
        OrganizationMember.mem_permission == "Manager"
    ).first()
    
    if not manager_check:
        raise HTTPException(status_code=403, detail="Chỉ Manager mới có quyền thêm thành viên!")

    new_user = db.query(User).filter(User.email == data.user_email).first()
    if not new_user:
        raise HTTPException(status_code=404, detail="Email người dùng không tồn tại!")
        
    existing_mem = db.query(OrganizationMember).filter(
        OrganizationMember.org_email == org_email, 
        OrganizationMember.mem_email == data.user_email
    ).first()
    if existing_mem:
        raise HTTPException(status_code=400, detail="Người này đã ở trong Tổ chức!")

    new_member = OrganizationMember(
        org_email=org_email,
        mem_email=data.user_email,
        mem_permission="Member"
    )
    db.add(new_member)
    db.commit()
    
    return {"message": f"Đã thêm {data.user_email} thành công!"}


@router.put("/organizations/{org_email}/members/{mem_email}/role")
def update_member_role(
    org_email: str, 
    mem_email: str, 
    data: MemberRoleUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Manager cấp quyền Poster hoặc Chuyển giao quyền Manager"""
    org = db.query(Organization).filter(Organization.org_email == org_email).first()
    target_member = db.query(OrganizationMember).filter(
        OrganizationMember.org_email == org_email, OrganizationMember.mem_email == mem_email
    ).first()
    current_manager = db.query(OrganizationMember).filter(
        OrganizationMember.org_email == org_email, OrganizationMember.mem_email == current_user.email
    ).first()

    if not org or not target_member or not current_manager:
        raise HTTPException(status_code=404, detail="Dữ liệu không hợp lệ")

    # Ép kiểu an toàn cho Enum
    mgr_perm = current_manager.mem_permission.value if hasattr(current_manager.mem_permission, 'value') else str(current_manager.mem_permission)
    if mgr_perm != "Manager":
        raise HTTPException(status_code=403, detail="Chỉ Manager mới có quyền thao tác!")

    if data.permission not in ["Manager", "Poster", "Member"]:
        raise HTTPException(status_code=400, detail="Role không hợp lệ!")

    # LOGIC TRUYỀN NGÔI (Chuyển quyền Manager)
    if data.permission == "Manager":
        current_manager.mem_permission = "Member"
        target_member.mem_permission = "Manager"
        org.representative_email = mem_email
        db.commit()
        return {"message": f"Đã chuyển quyền Manager cho {mem_email}. Bạn đã trở thành Member."}
        
    # Cấp quyền Poster / Member bình thường
    target_member.mem_permission = data.permission
    db.commit()
    return {"message": f"Đã cập nhật quyền của {mem_email} thành {data.permission}."}