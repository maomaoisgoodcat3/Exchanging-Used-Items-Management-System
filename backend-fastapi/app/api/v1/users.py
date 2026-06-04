"""Users & Organizations Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.services.auth_svc import get_current_user
from app.models.users import Users, Organizations, OrganizationMembers
from app.models.campaigns import Campaigns

router = APIRouter(prefix="/api/v1/users", tags=["Users & Organizations"])

# ==========================================
# 1. PYDANTIC SCHEMAS (Định nghĩa Dữ liệu)
# ==========================================
class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

class MemberAddRequest(BaseModel):
    user_email: EmailStr

class MemberRoleUpdate(BaseModel):
    permission: str # Manager, Poster, Member

# ==========================================
# 2. API QUẢN LÝ HỒ SƠ (PROFILE)
# ==========================================
@router.get("/me")
def get_my_profile(current_user: Users = Depends(get_current_user)):
    """Lấy thông tin cá nhân (Tab Account)"""
    return {
        "email": current_user.email,
        "name": current_user.name,
        "phone": current_user.phone,
        "role": current_user.role,
        "created_at": current_user.created_at
    }

@router.put("/me")
def update_my_profile(data: UserUpdate, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    """Cập nhật thông tin cá nhân (DB Thật)"""
    if data.name:
        current_user.name = data.name
    if data.phone:
        current_user.phone = data.phone
    db.commit()
    return {"message": "Cập nhật thông tin thành công!"}

# ==========================================
# 3. API QUẢN LÝ TỔ CHỨC (ORGANIZATIONS)
# ==========================================
@router.get("/my-organizations")
def get_my_organizations(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    """Lấy danh sách Tổ chức Users đang tham gia kèm Thống kê"""
    memberships = db.query(OrganizationMembers).filter(OrganizationMembers.mem_email == current_user.email).all()
    
    org_list = []
    for mem in memberships:
        org = db.query(Organizations).filter(Organizations.org_email == mem.org_email).first()
        if org:
            # Đếm số chiến dịch đã Approved
            campaign_count = db.query(Campaigns).filter(Campaigns.org_email == org.org_email, Campaigns.approval == "Approved").count()
            # Đếm tổng thành viên
            member_count = db.query(OrganizationMembers).filter(OrganizationMembers.org_email == org.org_email).count()
            
            org_list.append({
                "org_email": org.org_email,
                "org_name": org.org_name,
                "representative_email": org.representative_email,
                "my_permission": mem.mem_permission,
                "total_members": member_count,
                "total_campaigns": campaign_count
            })
    return org_list


@router.get("/organizations/{org_email}")
def get_organization_detail(org_email: str, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    """Xem chi tiết 1 Tổ chức & List Thành viên (Xếp Manager -> Poster -> Member)"""
    org = db.query(Organizations).filter(Organizations.org_email == org_email).first()
    if not org:
        raise HTTPException(status_code=404, detail="Không tìm thấy Tổ chức")

    memberships = db.query(OrganizationMembers).filter(OrganizationMembers.org_email == org_email).all()
    
    # Map ưu tiên xếp hạng
    role_priority = {"Manager": 1, "Poster": 2, "Member": 3}
    
    member_list = []
    for m in memberships:
        user_info = db.query(Users).filter(Users.email == m.mem_email).first()
        member_list.append({
            "email": m.mem_email,
            "name": user_info.name if user_info else "Unknown",
            "permission": m.mem_permission,
            "priority": role_priority.get(m.mem_permission, 4)
        })
        
    # Sắp xếp danh sách
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


@router.post("/organizations/{org_email}/members")
def add_organization_member(
    org_email: str, 
    data: MemberAddRequest, 
    db: Session = Depends(get_db), 
    current_user: Users = Depends(get_current_user)
):
    """Manager thêm thành viên mới"""
    manager_check = db.query(OrganizationMembers).filter(
        OrganizationMembers.org_email == org_email,
        OrganizationMembers.mem_email == current_user.email,
        OrganizationMembers.mem_permission == "Manager"
    ).first()
    
    if not manager_check:
        raise HTTPException(status_code=403, detail="Chỉ Manager mới có quyền thêm thành viên!")

    new_user = db.query(Users).filter(Users.email == data.user_email).first()
    if not new_user:
        raise HTTPException(status_code=404, detail="Email người dùng không tồn tại!")
        
    existing_mem = db.query(OrganizationMembers).filter(
        OrganizationMembers.org_email == org_email, 
        OrganizationMembers.mem_email == data.user_email
    ).first()
    if existing_mem:
        raise HTTPException(status_code=400, detail="Người này đã ở trong Tổ chức!")

    new_member = OrganizationMembers(
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
    current_user: Users = Depends(get_current_user)
):
    """Manager cấp quyền Poster hoặc Chuyển giao quyền Manager"""
    org = db.query(Organizations).filter(Organizations.org_email == org_email).first()
    target_member = db.query(OrganizationMembers).filter(
        OrganizationMembers.org_email == org_email, OrganizationMembers.mem_email == mem_email
    ).first()
    current_manager = db.query(OrganizationMembers).filter(
        OrganizationMembers.org_email == org_email, OrganizationMembers.mem_email == current_user.email
    ).first()

    if not org or not target_member or not current_manager:
        raise HTTPException(status_code=404, detail="Dữ liệu không hợp lệ")

    if current_manager.mem_permission != "Manager":
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


# ==========================================
# 4. CHỈNH SỬA THÔNG TIN TỔ CHỨC
# ==========================================
class OrgUpdateDescription(BaseModel):
    description: str

@router.put("/organizations/{org_email}")
def update_organization_info(
    org_email: str,
    data: OrgUpdateDescription,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """Người đại diện (Manager) chỉnh sửa Description của Tổ chức"""
    # 1. Kiểm tra quyền Manager
    manager_check = db.query(OrganizationMembers).filter(
        OrganizationMembers.org_email == org_email,
        OrganizationMembers.mem_email == current_user.email,
        OrganizationMembers.mem_permission == "Manager"
    ).first()
    
    if not manager_check:
        raise HTTPException(status_code=403, detail="Chỉ Manager mới có quyền chỉnh sửa thông tin Tổ chức!")

    # 2. Cập nhật DB
    org = db.query(Organizations).filter(Organizations.org_email == org_email).first()
    org.description = data.description
    db.commit()
    
    return {"message": "Cập nhật mô tả Tổ chức thành công!"}