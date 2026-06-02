const API_URL = 'http://127.0.0.1:8000/api/v1';
let authMode = 'login'; 
let currentViewingOrg = null;
let amIManager = false;

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
            // Ping thử API User
            const res = await fetch(`${API_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Token lỗi");
            
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
}

function openModal(id) { 
    document.getElementById(id).classList.add('active'); 
    document.querySelectorAll('.msg').forEach(msg => { 
        msg.style.display = 'none'; 
        msg.className = 'msg'; 
        msg.innerText = ''; 
    });
    
    // Mặc định gọi form Login hoặc tab Info khi mở popup
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
    
    msgBox.style.display = 'none'; // Ẩn thông báo cũ
    msgBox.innerText = '';
    
    // Ẩn tất cả các input đi để Lọc lại
    ['authName', 'authPhone', 'authPass', 'authVerifyPass'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });

    // Bật lại các input tùy theo Mode
    if (mode === 'login') {
        title.innerText = "Đăng Nhập"; 
        btn.innerText = "Đăng Nhập";
        document.getElementById('authPass').classList.remove('hidden');
        
        hintToggle.innerText = "Tạo tài khoản mới"; 
        hintToggle.onclick = (e) => { e.preventDefault(); switchAuthMode('register'); };
        
        hintForgot.style.display = 'block';
        hintForgot.onclick = (e) => { e.preventDefault(); switchAuthMode('forgot'); };
        
    } else if (mode === 'register') {
        title.innerText = "Đăng Ký Tài Khoản"; 
        btn.innerText = "Hoàn tất Đăng Ký";
        ['authName', 'authPhone', 'authPass', 'authVerifyPass'].forEach(id => document.getElementById(id).classList.remove('hidden'));
        
        hintToggle.innerText = "Đã có tài khoản? Đăng nhập"; 
        hintToggle.onclick = (e) => { e.preventDefault(); switchAuthMode('login'); };
        hintForgot.style.display = 'none';
        
    } else {
        title.innerText = "Khôi Phục Mật Khẩu"; 
        btn.innerText = "Gửi Yêu Cầu";
        
        hintToggle.innerText = "Quay lại Đăng nhập"; 
        hintToggle.onclick = (e) => { e.preventDefault(); switchAuthMode('login'); };
        hintForgot.style.display = 'none';
    }
}

async function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;
    const msgBox = document.getElementById('authMsg');
    const btn = document.getElementById('btnSubmitAuth');

    // Reset trạng thái nút bấm và thông báo
    msgBox.style.display = 'none';
    msgBox.className = 'msg';
    btn.disabled = true;
    btn.innerText = "Đang xử lý...";

    try {
        if (!email) throw new Error("Vui lòng nhập Email!");

        if (authMode === 'login') {
            if (!pass) throw new Error("Vui lòng nhập mật khẩu!");
            const formData = new URLSearchParams(); formData.append('username', email); formData.append('password', pass);
            
            const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: formData });
            const data = await res.json();
            
            if (res.ok) {
                sessionStorage.setItem('access_token', data.access_token); 
                sessionStorage.setItem('user_email', email);
                closeModal('authModal'); 
                checkLoginAndServerStatus(); 
                alert("Đăng nhập thành công!");
            } else {
                let errMsg = typeof data.detail === 'string' ? data.detail : "Sai thông tin đăng nhập";
                throw new Error(errMsg);
            }
        } 
        else if (authMode === 'register') {
            const name = document.getElementById('authName').value;
            const phone = document.getElementById('authPhone').value;
            const verifyPass = document.getElementById('authVerifyPass').value;
            
            if(!name || !phone || !pass || !verifyPass) throw new Error("Vui lòng điền đầy đủ thông tin!");
            if(pass !== verifyPass) throw new Error("Mật khẩu xác nhận không khớp!");

            const payload = { user_email: email, user_name: name, phone: phone, password: pass, verify_password: verifyPass };
            const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            
            if (res.ok) { 
                alert("Đăng ký thành công! Vui lòng đăng nhập bằng tài khoản vừa tạo."); 
                switchAuthMode('login'); // Tự quay về form đăng nhập
            } else {
                // XỬ LÝ LỖI 422 CỦA FASTAPI TẠI ĐÂY
                let errMsg = "Lỗi đăng ký";
                if (data.detail) {
                    if (Array.isArray(data.detail)) {
                        // Nếu là lỗi Validation của Pydantic
                        errMsg = data.detail.map(err => {
                            const field = err.loc[err.loc.length - 1]; // Lấy tên trường bị lỗi
                            if (field === 'user_email') return "- Email không đúng định dạng (VD: a@b.com)";
                            if (field === 'password' || field === 'verify_password') return "- Mật khẩu phải dài ít nhất 6 ký tự";
                            return `- Dữ liệu không hợp lệ: ${field}`;
                        }).join('\n');
                    } else {
                        // Lỗi Logic (Như email không có trong danh bạ trường)
                        errMsg = data.detail;
                    }
                }
                throw new Error(errMsg);
            }
        }
        else if (authMode === 'forgot') {
            const res = await fetch(`${API_URL}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_email: email }) });
            if (res.ok) { 
                msgBox.className = "msg success"; 
                msgBox.innerText = "Đã gửi yêu cầu khôi phục. Vui lòng check Terminal Backend!"; 
                msgBox.style.display = "block";
            }
            else throw new Error("Lỗi gửi yêu cầu khôi phục");
        }
    } catch (err) { 
        // Bắt mọi lỗi và HIỂN THỊ LÊN MÀN HÌNH
        msgBox.className = "msg error"; 
        msgBox.innerText = err.message || "Lỗi kết nối Server!"; 
        msgBox.style.display = "block"; 
    } finally {
        // Phục hồi lại nút bấm
        btn.disabled = false;
        if (authMode === 'login') btn.innerText = "Đăng Nhập";
        else if (authMode === 'register') btn.innerText = "Hoàn tất Đăng Ký";
        else btn.innerText = "Gửi Yêu Cầu";
    }
}

function handleLogout(showAlert = true) {
    sessionStorage.removeItem('access_token'); 
    sessionStorage.removeItem('user_email');
    document.getElementById('btnOpenAuth').classList.remove('hidden');
    document.getElementById('btnProfile').classList.add('hidden');
    closeModal('profileModal'); 
    switchMainTab('tab-posts');
    if(showAlert) alert("Đã đăng xuất!");
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
    const msgBox = document.getElementById('profMsg');
    msgBox.style.display = 'none'; // Xóa lỗi cũ
    const payload = { name: document.getElementById('profName').value, phone: document.getElementById('profPhone').value };
    try {
        const res = await fetch(`${API_URL}/users/me`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }, body: JSON.stringify(payload) });
        if (res.ok) { 
            msgBox.className="msg success"; 
            msgBox.innerText="Đã lưu thông tin mới!"; 
            msgBox.style.display="block"; 
        }
        else throw new Error("Lỗi cập nhật");
    } catch (err) { 
        msgBox.className="msg error"; msgBox.innerText="Lỗi API!"; msgBox.style.display="block"; 
    }
}

async function changePassword() {
    const msgBox = document.getElementById('pwdMsg');
    msgBox.style.display = 'none'; // Xóa lỗi cũ
    const payload = {
        old_password: document.getElementById('oldPass').value,
        new_password: document.getElementById('newPass').value,
        verify_new_password: document.getElementById('verifyNewPass').value
    };
    try {
        const res = await fetch(`${API_URL}/auth/change-password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }, body: JSON.stringify(payload) });
        if (res.ok) { 
            msgBox.className="msg success"; msgBox.innerText="Đổi mật khẩu thành công!"; msgBox.style.display="block"; 
        } else {
            const errData = await res.json();
            throw new Error(errData.detail);
        }
    } catch (err) { 
        msgBox.className="msg error"; msgBox.innerText=err.message; msgBox.style.display="block"; 
    }
}

// ==========================================
// 4. TỔ CHỨC (ORGANIZATIONS)
// ==========================================
async function loadMyOrganizations() {
    document.getElementById('orgListView').classList.remove('hidden');
    document.getElementById('orgDetailView').classList.add('hidden');
    const list = document.getElementById('myOrgList');
    list.innerHTML = '<p class="empty-text">Đang tải dữ liệu...</p>';
    
    try {
        const res = await fetch(`${API_URL}/users/my-organizations`, { headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }});
        const orgs = await res.json();
        if(orgs.length === 0) return list.innerHTML = '<p class="empty-text">Bạn chưa tham gia Tổ chức nào.</p>';
        
        list.innerHTML = orgs.map(o => `
            <div class="org-card" onclick="viewOrgDetail('${o.org_email}', '${o.my_permission}')">
                <h4>${o.org_name}</h4>
                <p>Vai trò của bạn: <span class="role-badge role-${o.my_permission}">${o.my_permission}</span></p>
                <div class="org-stats">
                    <span>👥 ${o.total_members} Member</span>
                    <span>🚩 ${o.total_campaigns} Campaign</span>
                </div>
            </div>
        `).join('');
    } catch(e) { list.innerHTML = '<p class="empty-text error">Lỗi API Tổ chức</p>'; }
}

async function viewOrgDetail(org_email, my_permission) {
    currentViewingOrg = org_email;
    amIManager = (my_permission === 'Manager');
    
    document.getElementById('orgListView').classList.add('hidden');
    document.getElementById('orgDetailView').classList.remove('hidden');
    
    const tools = document.getElementById('managerTools');
    amIManager ? tools.classList.remove('hidden') : tools.classList.add('hidden');

    try {
        const res = await fetch(`${API_URL}/users/organizations/${org_email}`, { headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }});
        const data = await res.json();
        
        document.getElementById('detailOrgName').innerText = data.org_info.org_name;
        document.getElementById('detailOrgDesc').innerText = data.org_info.description || "Tổ chức này chưa có mô tả.";
        
        const memList = document.getElementById('orgMemberList');
        memList.innerHTML = data.members.map(m => {
            let actionHtml = `<span class="role-badge role-${m.permission}">${m.permission}</span>`;
            if (amIManager && m.email !== sessionStorage.getItem('user_email')) {
                actionHtml = `
                    <select class="action-select" onchange="changeMemberRole('${m.email}', this.value)">
                        <option value="Manager" ${m.permission === 'Manager'?'selected':''}>👑 Manager (Chuyển giao)</option>
                        <option value="Poster" ${m.permission === 'Poster'?'selected':''}>📝 Poster</option>
                        <option value="Member" ${m.permission === 'Member'?'selected':''}>👤 Member</option>
                    </select>
                `;
            }
            return `
            <div class="member-item">
                <div class="member-info">
                    <span class="member-name">${m.name}</span>
                    <span class="member-email">${m.email}</span>
                </div>
                <div>${actionHtml}</div>
            </div>`;
        }).join('');

    } catch (e) { alert("Lỗi tải chi tiết!"); }
}

function backToOrgList() {
    document.getElementById('orgListView').classList.remove('hidden');
    document.getElementById('orgDetailView').classList.add('hidden');
}

async function addOrgMember() {
    const email = document.getElementById('newMemEmail').value;
    try {
        const res = await fetch(`${API_URL}/users/organizations/${currentViewingOrg}/members`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` },
            body: JSON.stringify({ user_email: email })
        });
        if (res.ok) { alert("Thêm thành công!"); document.getElementById('newMemEmail').value = ''; viewOrgDetail(currentViewingOrg, 'Manager'); }
        else alert((await res.json()).detail);
    } catch (e) { alert("Lỗi Server"); }
}

async function changeMemberRole(mem_email, new_role) {
    if(new_role === 'Manager') {
        if(!confirm(`CẢNH BÁO: Chuyển quyền Manager cho ${mem_email} đồng nghĩa bạn sẽ bị giáng cấp. Tiếp tục?`)) { 
            viewOrgDetail(currentViewingOrg, 'Manager'); return; 
        }
    }
    try {
        const res = await fetch(`${API_URL}/users/organizations/${currentViewingOrg}/members/${mem_email}/role`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` },
            body: JSON.stringify({ permission: new_role })
        });
        if (res.ok) { 
            alert((await res.json()).message); 
            if(new_role === 'Manager') backToOrgList(); else viewOrgDetail(currentViewingOrg, 'Manager');
        } else alert((await res.json()).detail);
    } catch (e) { alert("Lỗi Server"); }
}

function viewOrgCampaigns() {
    closeModal('profileModal');
    switchMainTab('tab-campaigns');
    alert("Chuyển sang Tab Campaign và hiển thị các chiến dịch của Tổ chức: " + currentViewingOrg);
}


// ==========================================
// 5. QUẢN LÝ CHIẾN DỊCH (CAMPAIGNS)
// ==========================================

// Gắn sự kiện để load dữ liệu khi người dùng chuyển qua Tab Campaign
const oldSwitchMainTab = switchMainTab;
switchMainTab = function(tabId) {
    oldSwitchMainTab(tabId);
    if(tabId === 'tab-campaigns') {
        document.getElementById('activeCampFilterText').classList.add('hidden'); // Reset bộ lọc
        loadCampaigns();
    }
};

async function loadCampaigns(orgEmailFilter = null) {
    const list = document.getElementById('globalCampaignsList');
    list.innerHTML = '<p class="empty-text">Đang tải...</p>';
    
    // Kiểm tra và cấp quyền hiện nút "Tạo Chiến Dịch"
    checkCampaignCreatePermission();

    try {
        let url = `${API_URL}/campaigns/`;
        if (orgEmailFilter) url += `?org_email=${orgEmailFilter}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if(data.length === 0) {
            list.innerHTML = '<p class="empty-text" style="grid-column: 1 / -1; text-align:center;">Chưa có chiến dịch nào.</p>';
            return;
        }

        // Dùng CSS Grid Card giống Orgs để hiển thị cho đẹp
        list.innerHTML = data.map(c => {
            const statusColor = c.approval === 'Approved' ? '#198754' : (c.approval === 'Pending' ? '#ffc107' : '#dc3545');
            const statusText = c.approval === 'Pending' ? 'black' : 'white';
            
            return `
            <div class="org-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
                ${c.thumbnail_url 
                    ? `<img src="${c.thumbnail_url}" style="width:100%; height:180px; object-fit:cover; border-bottom: 1px solid #eee;">` 
                    : `<div style="width:100%; height:180px; background:#f8f9fa; display:flex; align-items:center; justify-content:center; color:#ccc; border-bottom: 1px solid #eee;">Chưa có ảnh (IPFS)</div>`}
                
                <div style="padding: 15px; flex: 1; display: flex; flex-direction: column;">
                    <div style="margin-bottom: 10px;">
                        <span style="font-size: 11px; background: #e9ecef; padding: 4px 8px; border-radius: 12px; color: #555; font-weight:bold;">🏛️ ${c.org_name}</span>
                        <span style="font-size: 11px; background: ${statusColor}; color: ${statusText}; padding: 4px 8px; border-radius: 12px; float: right; font-weight:bold;">${c.approval}</span>
                    </div>
                    
                    <h3 style="margin: 0 0 10px; color: #0d6efd; font-size: 16px;">${c.title}</h3>
                    
                    <div style="font-size: 12px; color: #666; margin-top: auto; background: #f8f9fa; padding: 10px; border-radius: 6px;">
                        <b>Bắt đầu:</b> ${new Date(c.start_date).toLocaleDateString('vi-VN')} <br>
                        <b>Kết thúc:</b> ${new Date(c.end_date).toLocaleDateString('vi-VN')}
                    </div>
                </div>
            </div>
            `;
        }).join('');
    } catch (e) {
        list.innerHTML = '<p class="empty-text error">Lỗi tải dữ liệu chiến dịch</p>';
    }
}

// Hàm soi quyền User xem có được quyền tạo Campaign không
async function checkCampaignCreatePermission() {
    const btn = document.getElementById('btnOpenCreateCampaign');
    const select = document.getElementById('campOrgEmail');
    
    btn.classList.add('hidden');
    select.innerHTML = '<option value="">-- Chọn Tổ chức của bạn --</option>';

    if(!sessionStorage.getItem('access_token')) return;

    try {
        const res = await fetch(`${API_URL}/users/my-organizations`, { headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }});
        if(res.ok) {
            const orgs = await res.json();
            // Lọc các org mà user đang là Manager hoặc Poster
            const validOrgs = orgs.filter(o => o.my_permission === 'Manager' || o.my_permission === 'Poster');
            
            if(validOrgs.length > 0) {
                btn.classList.remove('hidden'); // Kích hoạt nút
                validOrgs.forEach(o => {
                    select.insertAdjacentHTML('beforeend', `<option value="${o.org_email}">${o.org_name} (${o.my_permission})</option>`);
                });
            }
        }
    } catch(e) {}
}

async function handleCreateCampaign() {
    const msgBox = document.getElementById('campMsg');
    const btn = document.getElementById('btnSubmitCamp');
    msgBox.style.display = 'none';
    btn.disabled = true;

    const orgEmail = document.getElementById('campOrgEmail').value;
    const title = document.getElementById('campTitle').value;
    const desc = document.getElementById('campDesc').value;
    const start = document.getElementById('campStart').value;
    const end = document.getElementById('campEnd').value;
    const image = document.getElementById('campImage').value;

    try {
        if(!orgEmail || !title || !desc || !start || !end) {
            throw new Error("Vui lòng nhập đầy đủ các trường bắt buộc có dấu (*)");
        }

        const payload = {
            org_email: orgEmail,
            title: title,
            description: desc,
            start_date: new Date(start).toISOString(),
            end_date: new Date(end).toISOString(),
            images: image ? [image] : []
        };

        const res = await fetch(`${API_URL}/campaigns/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` 
            },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if(res.ok) {
            alert(data.message);
            closeModal('campaignModal');
            
            // Xóa form
            document.getElementById('campTitle').value = '';
            document.getElementById('campDesc').value = '';
            document.getElementById('campImage').value = '';
            
            loadCampaigns(); // Tải lại danh sách
        } else {
            throw new Error(data.detail || "Lỗi tạo chiến dịch");
        }
    } catch (e) {
        msgBox.className = "msg error";
        msgBox.innerText = e.message || "Lỗi kết nối server!";
        msgBox.style.display = "block";
    } finally {
        btn.disabled = false;
    }
}

// Hàm liên kết từ bên Tab Account -> Tab Campaign
function viewOrgCampaigns() {
    closeModal('profileModal');
    switchMainTab('tab-campaigns'); // Gọi hàm đổi tab, hàm này sẽ tự động loadCampaigns()
    
    setTimeout(() => {
        // Sau đó gọi lại với filter org_email
        loadCampaigns(currentViewingOrg); 
        const filterText = document.getElementById('activeCampFilterText');
        filterText.innerText = `(Lọc theo Tổ chức)`;
        filterText.classList.remove('hidden');
    }, 100);
}