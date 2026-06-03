const API_URL = 'http://127.0.0.1:8000/api/v1';
let authMode = 'login'; 
let currentViewingOrg = null;
let amIManager = false;
let currentUserRole = "Guest"; // Thêm biến lưu quyền Admin/Member

document.addEventListener('DOMContentLoaded', () => {
    checkLoginAndServerStatus();
});

// ==========================================
// 1. KIỂM TRA PHIÊN & ĐIỀU HƯỚNG
// ==========================================
async function checkLoginAndServerStatus() {
    const token = sessionStorage.getItem('access_token');
    const email = sessionStorage.getItem('user_email');
    
    if (token && email) {
        try {
            const res = await fetch(`${API_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Token lỗi");
            
            const userData = await res.json();
            currentUserRole = String(userData.role).includes("Admin") ? "Admin" : "Member"; // Xác định quyền Admin
            
            document.getElementById('btnOpenAuth').classList.add('hidden');
            document.getElementById('btnProfile').innerText = `👤 ${email}`;
            document.getElementById('btnProfile').classList.remove('hidden');
        } catch(e) { handleLogout(false); }
    } else { handleLogout(false); }
}

function switchMainTab(tabId) {
    document.querySelectorAll('.main-tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.sidebar-menu .side-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    const targetBtn = document.querySelector(`.side-btn[onclick*="${tabId}"]`);
    if(targetBtn) targetBtn.classList.add('active');

    // Tự động load dữ liệu khi vào Tab Campaign
    if(tabId === 'tab-campaigns') {
        document.getElementById('activeCampFilterText').classList.add('hidden');
        loadCampaigns();
    }
}

function openModal(id) { 
    document.getElementById(id).classList.add('active'); 
    document.querySelectorAll('.msg').forEach(msg => { msg.style.display = 'none'; msg.className = 'msg'; msg.innerText = ''; });
    if(id === 'authModal') switchAuthMode('login');
    if(id === 'profileModal') switchProfileTab('prof-info'); 
}

function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// ==========================================
// 2. AUTHENTICATION (Đăng nhập, Đăng ký, Quên MK)
// ==========================================
function switchAuthMode(mode) {
    authMode = mode;
    const title = document.getElementById('authTitle');
    const btn = document.getElementById('btnSubmitAuth');
    const hintToggle = document.getElementById('authToggleHint');
    const hintForgot = document.getElementById('authForgotHint');
    const msgBox = document.getElementById('authMsg');
    
    msgBox.style.display = 'none'; msgBox.innerText = '';
    
    ['authName', 'authPhone', 'authPass', 'authVerifyPass', 'authResetToken'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById('authPass').placeholder = "Mật khẩu...";

    if (mode === 'login') {
        title.innerText = "Đăng Nhập"; btn.innerText = "Đăng Nhập";
        document.getElementById('authPass').classList.remove('hidden');
        hintToggle.innerText = "Tạo tài khoản mới"; hintToggle.onclick = (e) => { e.preventDefault(); switchAuthMode('register'); };
        hintForgot.style.display = 'block'; hintForgot.innerText = "Quên mật khẩu?"; hintForgot.onclick = (e) => { e.preventDefault(); switchAuthMode('forgot'); };
    } else if (mode === 'register') {
        title.innerText = "Đăng Ký Tài Khoản"; btn.innerText = "Hoàn tất Đăng Ký";
        ['authName', 'authPhone', 'authPass', 'authVerifyPass'].forEach(id => document.getElementById(id).classList.remove('hidden'));
        hintToggle.innerText = "Đã có tài khoản? Đăng nhập"; hintToggle.onclick = (e) => { e.preventDefault(); switchAuthMode('login'); };
        hintForgot.style.display = 'none';
    } else if (mode === 'forgot') {
        title.innerText = "Khôi Phục Mật Khẩu"; btn.innerText = "Gửi Yêu Cầu";
        hintToggle.innerText = "Quay lại Đăng nhập"; hintToggle.onclick = (e) => { e.preventDefault(); switchAuthMode('login'); };
        hintForgot.style.display = 'block'; hintForgot.innerText = "Đã có mã Token? Đặt lại mật khẩu"; hintForgot.onclick = (e) => { e.preventDefault(); switchAuthMode('reset'); };
    } else if (mode === 'reset') {
        title.innerText = "Đặt Lại Mật Khẩu"; btn.innerText = "Xác Nhận Đổi Mật Khẩu";
        document.getElementById('authResetToken').classList.remove('hidden');
        document.getElementById('authPass').classList.remove('hidden'); document.getElementById('authPass').placeholder = "Mật khẩu mới...";
        document.getElementById('authVerifyPass').classList.remove('hidden'); document.getElementById('authVerifyPass').placeholder = "Xác nhận mật khẩu mới...";
        hintToggle.innerText = "Quay lại Đăng nhập"; hintToggle.onclick = (e) => { e.preventDefault(); switchAuthMode('login'); };
        hintForgot.style.display = 'none';
    }
}

async function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;
    const msgBox = document.getElementById('authMsg');
    const btn = document.getElementById('btnSubmitAuth');
    msgBox.style.display = 'none'; msgBox.className = 'msg'; btn.disabled = true; btn.innerText = "Đang xử lý...";

    try {
        if (!email) throw new Error("Vui lòng nhập Email!");

        if (authMode === 'login') {
            if (!pass) throw new Error("Vui lòng nhập mật khẩu!");
            const formData = new URLSearchParams(); formData.append('username', email); formData.append('password', pass);
            const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                sessionStorage.setItem('access_token', data.access_token); sessionStorage.setItem('user_email', email);
                closeModal('authModal'); checkLoginAndServerStatus(); alert("Đăng nhập thành công!");
            } else throw new Error(typeof data.detail === 'string' ? data.detail : "Sai thông tin đăng nhập");
        } 
        else if (authMode === 'register') {
            const name = document.getElementById('authName').value; const phone = document.getElementById('authPhone').value; const verifyPass = document.getElementById('authVerifyPass').value;
            if(!name || !phone || !pass || !verifyPass) throw new Error("Vui lòng điền đầy đủ thông tin!");
            if(pass !== verifyPass) throw new Error("Mật khẩu xác nhận không khớp!");
            const payload = { user_email: email, user_name: name, phone: phone, password: pass, verify_password: verifyPass };
            const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) { alert("Đăng ký thành công! Vui lòng đăng nhập."); switchAuthMode('login'); }
            else throw new Error("Lỗi đăng ký");
        }
        else if (authMode === 'forgot') {
            const res = await fetch(`${API_URL}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_email: email }) });
            if (res.ok) { msgBox.className = "msg success"; msgBox.innerText = "Đã gửi yêu cầu! Copy mã (Token) trong Terminal và chọn 'Đã có mã Token?' để tiếp tục."; msgBox.style.display = "block"; }
            else throw new Error("Lỗi gửi yêu cầu khôi phục");
        }
        else if (authMode === 'reset') {
            const token = document.getElementById('authResetToken').value; const verifyPass = document.getElementById('authVerifyPass').value;
            if(!token || !pass || !verifyPass) throw new Error("Vui lòng điền đủ thông tin!");
            if(pass !== verifyPass) throw new Error("Mật khẩu xác nhận không khớp!");
            const res = await fetch(`${API_URL}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reset_token: token, new_password: pass }) });
            if (res.ok) { alert("Khôi phục mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới."); switchAuthMode('login'); }
            else throw new Error("Lỗi khôi phục mật khẩu");
        }
    } catch (err) { msgBox.className = "msg error"; msgBox.innerText = err.message || "Lỗi kết nối Server!"; msgBox.style.display = "block"; } 
    finally {
        btn.disabled = false;
        if (authMode === 'login') btn.innerText = "Đăng Nhập"; else if (authMode === 'register') btn.innerText = "Hoàn tất Đăng Ký";
        else if (authMode === 'forgot') btn.innerText = "Gửi Yêu Cầu"; else btn.innerText = "Xác Nhận Đổi Mật Khẩu";
    }
}

function handleLogout(showAlert = true) {
    sessionStorage.removeItem('access_token'); sessionStorage.removeItem('user_email'); currentUserRole = "Guest";
    document.getElementById('btnOpenAuth').classList.remove('hidden'); document.getElementById('btnProfile').classList.add('hidden');
    closeModal('profileModal'); switchMainTab('tab-posts'); if(showAlert) alert("Đã đăng xuất!");
}

// ==========================================
// 3. PROFILE LÝ (INFO & PASSWORD)
// ==========================================
function switchProfileTab(tabId) {
    document.querySelectorAll('.prof-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.prof-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.prof-tab-btn[onclick*="${tabId}"]`).classList.add('active');
    if(tabId === 'prof-organizations') loadMyOrganizations();
    if(tabId === 'prof-info') fetchMyProfileInfo();
}

async function fetchMyProfileInfo() {
    const res = await fetch(`${API_URL}/users/me`, { headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }});
    if (res.ok) {
        const data = await res.json();
        document.getElementById('profEmail').value = data.email;
        document.getElementById('profName').value = data.name;
        document.getElementById('profPhone').value = data.phone;
    }
}

async function updateProfile() {
    const msgBox = document.getElementById('profMsg'); msgBox.style.display = 'none';
    const payload = { name: document.getElementById('profName').value, phone: document.getElementById('profPhone').value };
    try {
        const res = await fetch(`${API_URL}/users/me`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }, body: JSON.stringify(payload) });
        if (res.ok) { msgBox.className="msg success"; msgBox.innerText="Đã lưu thông tin mới!"; msgBox.style.display="block"; } else throw new Error("Lỗi cập nhật");
    } catch (err) { msgBox.className="msg error"; msgBox.innerText="Lỗi API!"; msgBox.style.display="block"; }
}

async function changePassword() {
    const msgBox = document.getElementById('pwdMsg'); msgBox.style.display = 'none';
    const payload = { old_password: document.getElementById('oldPass').value, new_password: document.getElementById('newPass').value, verify_new_password: document.getElementById('verifyNewPass').value };
    try {
        const res = await fetch(`${API_URL}/auth/change-password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }, body: JSON.stringify(payload) });
        if (res.ok) { msgBox.className="msg success"; msgBox.innerText="Đổi mật khẩu thành công!"; msgBox.style.display="block"; }
        else throw new Error((await res.json()).detail);
    } catch (err) { msgBox.className="msg error"; msgBox.innerText=err.message; msgBox.style.display="block"; }
}
// ==========================================
// 4. TỔ CHỨC (ORGANIZATIONS)
// ==========================================
async function loadMyOrganizations() {
    document.getElementById('orgListView').classList.remove('hidden'); document.getElementById('orgDetailView').classList.add('hidden');
    const list = document.getElementById('myOrgList'); list.innerHTML = '<p class="empty-text">Đang tải dữ liệu...</p>';
    try {
        const res = await fetch(`${API_URL}/users/my-organizations`, { headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }});
        const orgs = await res.json();
        if(orgs.length === 0) return list.innerHTML = '<p class="empty-text">Bạn chưa tham gia Tổ chức nào.</p>';
        list.innerHTML = orgs.map(o => `
            <div class="org-card" onclick="viewOrgDetail('${o.org_email}', '${o.my_permission}')">
                <h4>${o.org_name}</h4>
                <p>Vai trò của bạn: <span class="role-badge role-${o.my_permission}">${o.my_permission}</span></p>
                <div class="org-stats"><span>👥 ${o.total_members} Member</span><span>🚩 ${o.total_campaigns} Campaign</span></div>
            </div>`).join('');
    } catch(e) { list.innerHTML = '<p class="empty-text error">Lỗi API Tổ chức</p>'; }
}

async function viewOrgDetail(org_email, my_permission) {
    currentViewingOrg = org_email; amIManager = (my_permission === 'Manager');
    document.getElementById('orgListView').classList.add('hidden'); document.getElementById('orgDetailView').classList.remove('hidden');
    const tools = document.getElementById('managerTools'); amIManager ? tools.classList.remove('hidden') : tools.classList.add('hidden');

    try {
        const res = await fetch(`${API_URL}/users/organizations/${org_email}`, { headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }});
        const data = await res.json();
        document.getElementById('detailOrgName').innerText = data.org_info.org_name;
        document.getElementById('detailOrgDesc').innerText = data.org_info.description || "Tổ chức này chưa có mô tả.";
        
        const editBtn = document.getElementById('btnEditDesc'); amIManager ? editBtn.classList.remove('hidden') : editBtn.classList.add('hidden');
        
        // Đã sửa: Member/Poster chỉ thấy Label chứ không thấy Select phân quyền
        document.getElementById('orgMemberList').innerHTML = data.members.map(m => {
            if (amIManager && m.email !== sessionStorage.getItem('user_email')) {
                return `<div class="member-item"><div class="member-info"><span class="member-name">${m.name}</span><span class="member-email">${m.email}</span></div>
                    <div><select class="action-select" onchange="changeMemberRole('${m.email}', this.value)">
                        <option value="Manager" ${m.permission === 'Manager'?'selected':''}>👑 Manager</option>
                        <option value="Poster" ${m.permission === 'Poster'?'selected':''}>📝 Poster</option>
                        <option value="Member" ${m.permission === 'Member'?'selected':''}>👤 Member</option>
                    </select></div></div>`;
            } else {
                return `<div class="member-item"><div class="member-info"><span class="member-name">${m.name}</span><span class="member-email">${m.email}</span></div>
                    <div><span class="role-badge role-${m.permission}">${m.permission}</span></div></div>`;
            }
        }).join('');
    } catch (e) { alert("Lỗi tải chi tiết!"); }
}

function backToOrgList() { document.getElementById('orgListView').classList.remove('hidden'); document.getElementById('orgDetailView').classList.add('hidden'); }
function toggleEditDesc() {
    const form = document.getElementById('editDescForm');
    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden'); document.getElementById('btnEditDesc').classList.add('hidden');
        const currentText = document.getElementById('detailOrgDesc').innerText;
        document.getElementById('editDescInput').value = currentText === "Chưa có mô tả." ? "" : currentText;
    } else { form.classList.add('hidden'); document.getElementById('btnEditDesc').classList.remove('hidden'); }
}
async function saveOrgDescription() {
    const newDesc = document.getElementById('editDescInput').value;
    try {
        const res = await fetch(`${API_URL}/users/organizations/${currentViewingOrg}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` },
            body: JSON.stringify({ description: newDesc })
        });
        if (res.ok) { alert("Cập nhật thành công!"); toggleEditDesc(); viewOrgDetail(currentViewingOrg, 'Manager'); } else alert((await res.json()).detail);
    } catch(e) { alert("Lỗi kết nối Server"); }
}
async function addOrgMember() {
    const email = document.getElementById('newMemEmail').value;
    try {
        const res = await fetch(`${API_URL}/users/organizations/${currentViewingOrg}/members`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` },
            body: JSON.stringify({ user_email: email })
        });
        if (res.ok) { alert("Thêm thành công!"); document.getElementById('newMemEmail').value = ''; viewOrgDetail(currentViewingOrg, 'Manager'); } else alert((await res.json()).detail);
    } catch (e) { alert("Lỗi Server"); }
}
async function changeMemberRole(mem_email, new_role) {
    if(new_role === 'Manager' && !confirm(`CẢNH BÁO: Chuyển quyền Manager sẽ khiến bạn mất quyền. Tiếp tục?`)) { viewOrgDetail(currentViewingOrg, 'Manager'); return; }
    try {
        const res = await fetch(`${API_URL}/users/organizations/${currentViewingOrg}/members/${mem_email}/role`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` },
            body: JSON.stringify({ permission: new_role })
        });
        if (res.ok) { alert((await res.json()).message); new_role === 'Manager' ? backToOrgList() : viewOrgDetail(currentViewingOrg, 'Manager'); } 
        else alert((await res.json()).detail);
    } catch (e) { alert("Lỗi Server"); }
}
function viewOrgCampaigns() { closeModal('profileModal'); switchMainTab('tab-campaigns'); setTimeout(() => { loadCampaigns(currentViewingOrg); }, 100); }

// ==========================================
// 5. QUẢN LÝ CHIẾN DỊCH (ẢNH CLOUD, REJECT, RESENDING)
// ==========================================
let myOrgRoles = {}; 

document.getElementById('campImageFile')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
        document.getElementById('imgPreview').classList.remove('hidden');
        document.getElementById('previewImgTag').src = URL.createObjectURL(file);
    } else document.getElementById('imgPreview').classList.add('hidden');
});

// Fix lỗi Upload Cloud: Ép kiểu File sang chuỗi Base64
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

async function uploadImageToImgBB(file) {
    try {
        const base64Img = await toBase64(file);
        const formData = new FormData(); 
        formData.append('key', '63a6a1d82136e0952086fc505c2196fb'); 
        formData.append('image', base64Img); 
        
        const res = await fetch(`https://api.imgbb.com/1/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        if(data.success) return data.data.url;
    } catch (e) { console.error("ImgBB Error:", e); }
    throw new Error("Lỗi Upload ảnh Cloud!");
}

const oldSwitchMainTab = switchMainTab;
switchMainTab = function(tabId) {
    oldSwitchMainTab(tabId);
    if(tabId === 'tab-campaigns') { document.getElementById('activeCampFilterText').classList.add('hidden'); loadCampaigns(); }
};

async function loadCampaigns(orgEmailFilter = null) {
    const list = document.getElementById('globalCampaignsList');
    list.innerHTML = '<p class="empty-text">Đang tải...</p>';
    await checkCampaignCreatePermission(); 

    try {
        let url = `${API_URL}/campaigns/`;
        if (orgEmailFilter) url += `?org_email=${orgEmailFilter}`;

        const headers = {};
        const token = sessionStorage.getItem('access_token');
        if(token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(url, { headers });
        let data = await res.json();
        if(data.length === 0) return list.innerHTML = '<p class="empty-text" style="grid-column: 1 / -1; text-align:center;">Chưa có chiến dịch nào.</p>';

        list.innerHTML = data.map(c => {
            const isOwner = !!myOrgRoles[c.org_email]; // Đã fix tên biến
            
            // CHỈ HIỆN MÁC VỚI ADMIN HOẶC CHỦ TỔ CHỨC
            let statusHtml = '';
            if (currentUserRole === 'Admin' || isOwner) {
                let bgColor = '#198754'; let textColor = 'white';
                if (c.approval === 'Pending') { bgColor = '#ffc107'; textColor = 'black'; }
                else if (c.approval === 'Resending') { bgColor = '#17a2b8'; textColor = 'white'; }
                else if (c.approval === 'Rejected') { bgColor = '#dc3545'; textColor = 'white'; }
                statusHtml = `<span style="font-size: 11px; background: ${bgColor}; color: ${textColor}; padding: 4px 8px; border-radius: 12px; float: right; font-weight:bold;">${c.approval}</span>`;
            }

            // Nút duyệt của Admin
            let adminActions = '';
            if (currentUserRole === 'Admin' && (c.approval === 'Pending' || c.approval === 'Resending')) {
                adminActions = `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc; display:flex; gap:10px;">
                        <button class="btn btn-primary" style="flex:1; padding: 5px; font-size:12px;" onclick="reviewCampaign(${c.campaign_id}, 'approve', event)">✅ Duyệt</button>
                        <button class="btn btn-danger" style="flex:1; padding: 5px; font-size:12px;" onclick="reviewCampaign(${c.campaign_id}, 'reject', event)">❌ Từ chối</button>
                    </div>`;
            }

            // Khung Báo lỗi + Nút sửa cho Manager/Poster
            let rejectHtml = '';
            if (c.approval === 'Rejected' && isOwner) {
                rejectHtml = `
                    <div style="background: #ffeeba; color: #856404; padding: 10px; border-radius: 6px; font-size: 12px; margin-bottom: 10px; margin-top: 10px;">
                        <b>⚠️ Lý do từ chối:</b> ${c.reject_reason || 'Không có lý do'}
                    </div>
                    <button class="btn btn-warning" style="width: 100%; font-size: 13px; padding: 6px;" onclick="openEditCampaign(${c.campaign_id}, '${c.org_email}', '${c.title.replace(/'/g, "\\'")}', '${(c.description||'').replace(/'/g, "\\'")}', '${c.start_date}', '${c.end_date}', '${c.thumbnail_url||''}', event)">✏️ Chỉnh sửa & Gửi lại duyệt</button>
                `;
            }

            return `
            <div style="background:white; border-radius:8px; border:1px solid #ddd; overflow: hidden; display: flex; flex-direction: column; cursor:pointer;" onclick="viewCampaignPosts(${c.campaign_id}, '${c.title}')">
                ${c.thumbnail_url ? `<img src="${c.thumbnail_url}" style="width:100%; height:160px; object-fit:cover; border-bottom: 1px solid #eee;">` : `<div style="width:100%; height:160px; background:#f8f9fa; display:flex; align-items:center; justify-content:center; color:#ccc; border-bottom: 1px solid #eee;">Chưa có ảnh</div>`}
                <div style="padding: 15px; flex: 1; display: flex; flex-direction: column;">
                    <div style="margin-bottom: 10px;"><span style="font-size: 11px; background: #e9ecef; padding: 4px 8px; border-radius: 12px; color: #555; font-weight:bold;">🏛️ ${c.org_name}</span>${statusHtml}</div>
                    <h3 style="margin: 0 0 10px; color: #0d6efd; font-size: 16px;">${c.title}</h3>
                    <div style="font-size: 12px; color: #666; margin-top: auto; background: #f8f9fa; padding: 10px; border-radius: 6px;">
                        <b>Bắt đầu:</b> ${new Date(c.start_date).toLocaleDateString('vi-VN')} <br><b>Kết thúc:</b> ${new Date(c.end_date).toLocaleDateString('vi-VN')}
                    </div>
                    ${rejectHtml}
                    ${adminActions}
                </div>
            </div>`;
        }).join('');
    } catch (e) { list.innerHTML = '<p class="empty-text error">Lỗi tải dữ liệu</p>'; }
}

function viewCampaignPosts(campaignId, title) {
    switchMainTab('tab-posts');
    const filterText = document.getElementById('activeFilterText');
    if(filterText) { filterText.innerText = `(Chiến dịch: ${title})`; filterText.classList.remove('hidden'); }
}

async function reviewCampaign(id, action, event) {
    event.stopPropagation(); 
    let reason = null;
    if (action === 'reject') {
        reason = prompt("Nhập lý do từ chối chiến dịch này (Bắt buộc):");
        if (!reason) { alert("Phải nhập lý do từ chối!"); return; }
    }
    try {
        const res = await fetch(`${API_URL}/campaigns/${id}/approve`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` },
            body: JSON.stringify({ action: action, reject_reason: reason })
        });
        if (res.ok) { alert("Thao tác thành công!"); loadCampaigns(); } else alert("Lỗi hệ thống!");
    } catch(e) { alert("Lỗi Server!"); }
}

async function checkCampaignCreatePermission() {
    myOrgRoles = {}; 
    const btn = document.getElementById('btnOpenCreateCampaign');
    const select = document.getElementById('campOrgEmail');
    if(!btn) return;
    
    btn.classList.add('hidden'); select.innerHTML = '<option value="">-- Chọn Tổ chức của bạn --</option>';
    const token = sessionStorage.getItem('access_token');
    if(!token) return; 

    try {
        const res = await fetch(`${API_URL}/users/my-organizations`, { headers: { 'Authorization': `Bearer ${token}` }});
        if(res.ok) {
            const orgs = await res.json();
            const validOrgs = orgs.filter(o => o.my_permission === 'Manager' || o.my_permission === 'Poster');
            if(validOrgs.length > 0 && currentUserRole !== 'Admin') btn.classList.remove('hidden');
            validOrgs.forEach(o => {
                myOrgRoles[o.org_email] = o.my_permission; 
                select.insertAdjacentHTML('beforeend', `<option value="${o.org_email}">${o.org_name}</option>`);
            });
        }
    } catch(e) {}
}

function openEditCampaign(id, orgEmail, title, desc, start, end, imgUrl, event) {
    event.stopPropagation();
    document.getElementById('campModalTitle').innerText = "Chỉnh Sửa & Gửi Lại Duyệt";
    document.getElementById('campEditId').value = id;
    document.getElementById('campOrgEmail').value = orgEmail;
    document.getElementById('campTitle').value = title;
    document.getElementById('campDesc').value = desc;
    if(start) document.getElementById('campStart').value = start.substring(0, 16);
    if(end) document.getElementById('campEnd').value = end.substring(0, 16);
    
    document.getElementById('campExistingImage').value = imgUrl || "";
    if(imgUrl) { document.getElementById('imgPreview').classList.remove('hidden'); document.getElementById('previewImgTag').src = imgUrl; }
    openModal('campaignModal');
}

async function handleSubmitCampaign() {
    const msgBox = document.getElementById('campMsg');
    const btn = document.getElementById('btnSubmitCamp');
    msgBox.style.display = 'none'; btn.disabled = true;

    const editId = document.getElementById('campEditId').value;
    const orgEmail = document.getElementById('campOrgEmail').value;
    const title = document.getElementById('campTitle').value;
    const desc = document.getElementById('campDesc').value;
    const start = document.getElementById('campStart').value;
    const end = document.getElementById('campEnd').value;
    const fileInput = document.getElementById('campImageFile');
    let imageUrl = document.getElementById('campExistingImage').value;

    try {
        if(!orgEmail || !title || !desc || !start || !end) throw new Error("Vui lòng điền đủ thông tin bắt buộc!");
        if(fileInput.files.length > 0) { btn.innerText = "Đang Upload ảnh lên Cloud..."; imageUrl = await uploadImageToImgBB(fileInput.files[0]); }
        btn.innerText = "Đang xử lý...";
        
        const payload = {
            org_email: orgEmail, title: title, description: desc,
            start_date: new Date(start).toISOString(), end_date: new Date(end).toISOString(),
            image_url: imageUrl
        };
        const endpoint = editId ? `${API_URL}/campaigns/${editId}` : `${API_URL}/campaigns/`;
        const res = await fetch(endpoint, {
            method: editId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` },
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            alert(editId ? "Gửi lại kiểm duyệt thành công!" : "Tạo Chiến dịch thành công!");
            closeModal('campaignModal'); document.getElementById('campEditId').value = ''; 
            document.getElementById('campTitle').value = ''; document.getElementById('campDesc').value = ''; 
            document.getElementById('imgPreview').classList.add('hidden'); fileInput.value = ''; document.getElementById('campExistingImage').value = '';
            document.getElementById('campModalTitle').innerText = "Khởi Tạo Chiến Dịch";
            loadCampaigns();
        } else throw new Error((await res.json()).detail || "Lỗi tạo chiến dịch");
    } catch (e) { msgBox.className = "msg error"; msgBox.innerText = e.message; msgBox.style.display = "block"; } 
    finally { btn.disabled = false; btn.innerText = "Gửi Yêu Cầu Duyệt"; }
}