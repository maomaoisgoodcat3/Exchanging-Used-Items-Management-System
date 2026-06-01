// ==========================================
// 1. CẤU HÌNH & TRẠNG THÁI (STATE)
// ==========================================
const API_URL = 'http://127.0.0.1:8000/api/v1';
let isLoginMode = true;
let currentUserRole = "Guest"; // Mặc định là Khách
let currentPostFilterId = null; 

// ==========================================
// 2. XỬ LÝ GIAO DIỆN CHUYỂN TAB & POPUP
// ==========================================
function switchMainTab(tabId) {
    document.querySelectorAll('.main-tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.main-nav-tabs .nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    const targetBtn = document.querySelector(`.main-nav-tabs .nav-btn[onclick*="${tabId}"]`);
    if(targetBtn) targetBtn.classList.add('active');
}

function switchProfileTab(tabId) {
    document.querySelectorAll('.prof-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.profile-sidebar .prof-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    const targetBtn = document.querySelector(`.prof-tab-btn[onclick*="${tabId}"]`);
    if(targetBtn) targetBtn.classList.add('active');
    if(tabId === 'prof-myposts') loadMyPosts();
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.querySelectorAll('.msg').forEach(msg => msg.style.display = 'none');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('authTitle');
    const btn = document.getElementById('btnSubmitAuth');
    
    if (isLoginMode) {
        title.innerText = "Đăng Nhập";
        btn.innerText = "Xác Nhận Đăng Nhập";
        document.getElementById('authName').classList.add('hidden');
        document.getElementById('authPhone').classList.add('hidden');
    } else {
        title.innerText = "Đăng Ký Tài Khoản";
        btn.innerText = "Đăng Ký";
        document.getElementById('authName').classList.remove('hidden');
        document.getElementById('authPhone').classList.remove('hidden');
    }
}

// ==========================================
// 3. AUTH & TỰ ĐỘNG PHÂN QUYỀN (SMART ROLE)
// ==========================================
async function checkLoginStatus() {
    const token = localStorage.getItem('access_token');
    const email = localStorage.getItem('user_email');
    
    if (token && email) {
        document.getElementById('btnOpenAuth').classList.add('hidden');
        document.getElementById('btnOpenPost').classList.remove('hidden');
        document.getElementById('btnLogout').classList.remove('hidden');
        
        const btnProfile = document.getElementById('btnProfile');
        btnProfile.innerText = `👤 ${email}`;
        btnProfile.classList.remove('hidden');
        
        // TỰ ĐỘNG PHÂN QUYỀN
        try {
            const res = await fetch(`${API_URL}/posts/admin-all`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) currentUserRole = "Admin";
            else currentUserRole = "Member";
        } catch(e) { currentUserRole = "Member"; }

    } else {
        currentUserRole = "Guest";
        document.getElementById('btnOpenAuth').classList.remove('hidden');
        document.getElementById('btnOpenPost').classList.add('hidden');
        document.getElementById('btnLogout').classList.add('hidden');
        document.getElementById('btnProfile').classList.add('hidden');
    }
    loadGlobalPosts(); // Render lại chợ theo quyền mới nhất
}

async function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;
    const msgBox = document.getElementById('authMsg');

    if (isLoginMode) {
        const formData = new URLSearchParams();
        formData.append('username', email); formData.append('password', pass);
        try {
            const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('user_email', email);
                closeModal('authModal');
                await checkLoginStatus(); // Gọi lại hàm phân quyền
                alert("Đăng nhập thành công!");
            } else { msgBox.className = "msg error"; msgBox.innerText = data.detail; }
        } catch (err) { msgBox.className = "msg error"; msgBox.innerText = "Lỗi Server!"; }
    } else {
        // ... (Logic đăng ký giữ nguyên) ...
        alert("Tính năng đăng ký đang bảo trì trong bản này để tập trung test duyệt bài!");
    }
}

function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    checkLoginStatus();
    switchMainTab('tab-posts');
    alert("Đã đăng xuất!");
}

// ==========================================
// 4. HIỂN THỊ LOGIC BÀI VIẾT CHUẨN MỰC
// ==========================================
function createPostCardHTML(p, isMini = false) {
    const status = p.status || 'Approved';
    const isClosed = p.open_status === 'Closed' || status === 'Rejected';
    const dotClass = isClosed ? 'dot-closed' : 'dot-available';
    const statusText = isClosed ? 'Đã đóng' : 'Sẵn sàng';
    
    let approvalTag = '';
    let adminActions = '';
    let rejectionNotice = '';

    // Logic xử lý Lý do từ chối (Chỉ Owner và Admin mới thấy)
    if (status === 'Rejected' && p.rejection_reason && (currentUserRole === 'Admin' || isMini)) {
        rejectionNotice = `<div style="background: #f8d7da; color: #842029; padding: 10px; margin-top: 10px; border-radius: 4px; font-size: 13px;"><b>Lý do từ chối:</b> ${p.rejection_reason}</div>`;
    }

    // Logic Giao diện Admin: Thấy mọi trạng thái + Nút Duyệt/Từ chối luôn hiển thị
    if (currentUserRole === 'Admin' && !isMini) {
        let color = status === 'Approved' ? '#198754' : (status === 'Pending' ? '#ffc107' : '#dc3545');
        approvalTag = `<span style="background: ${color}; color: ${status === 'Pending' ? 'black':'white'}; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 10px;">Duyệt: ${status}</span>`;
        
        adminActions = `
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc;">
                <button class="btn btn-primary" style="padding: 5px 15px; font-size: 13px;" onclick="reviewPost(${p.post_id}, 'approve')">✅ Duyệt (Approve)</button>
                <button class="btn btn-danger" style="padding: 5px 15px; font-size: 13px; margin-left: 10px;" onclick="reviewPost(${p.post_id}, 'reject')">❌ Từ chối (Reject)</button>
            </div>
        `;
    } 
    // Logic Giao diện Owner (Mini in Profile): Thấy trạng thái chi tiết của mình
    else if (isMini) {
        let color = status === 'Approved' ? '#198754' : (status === 'Pending' ? '#ffc107' : '#dc3545');
        approvalTag = `<span style="background: ${color}; color: ${status === 'Pending' ? 'black':'white'}; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 10px;">Trạng thái: ${status}</span>`;
    }

    // Giao diện Mini (Owner)
    if (isMini) {
        return `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0; cursor: pointer;">
                <div style="font-weight: bold;" onclick="viewPostDetail(${p.post_id})">${p.title}</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    <span class="status-dot ${dotClass}"></span> ${statusText} ${approvalTag}
                </div>
                ${rejectionNotice}
            </div>`;
    }

    // Giao diện Full (Chợ chung)
    return `
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 15px; opacity: ${isClosed && currentUserRole !== 'Admin' ? '0.6' : '1'};">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span class="status-dot ${dotClass}"></span> 
                <span style="font-size: 13px; font-weight: bold; color: #555;">${statusText}</span>
                ${approvalTag}
            </div>
            <h3 style="margin: 0 0 5px;">${p.title}</h3>
            <p style="font-size: 13px; color: #666; margin: 0 0 10px;">Đăng bởi: ${p.seller_email} | Nhãn: ${p.post_category || 'Selling'}</p>
            <p style="font-size: 14px;">${p.description || 'Không có mô tả'}</p>
            ${rejectionNotice}
            ${adminActions}
        </div>`;
}

// ==========================================
// 5. CALL API LẤY DỮ LIỆU
// ==========================================
async function loadGlobalPosts() {
    const list = document.getElementById('globalPostsList');
    list.innerHTML = '<p class="empty-text">Đang tải dữ liệu...</p>';
    
    try {
        let apiUrl = currentUserRole === 'Admin' ? `${API_URL}/posts/admin-all` : `${API_URL}/posts/`;
        let options = currentUserRole === 'Admin' ? { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } } : {};
        
        const res = await fetch(apiUrl, options);
        let posts = await res.json();
        
        if (currentPostFilterId) posts = posts.filter(p => p.post_id === currentPostFilterId);
        
        if (posts.length === 0) return list.innerHTML = '<p class="empty-text">Không có bài viết nào.</p>';
        list.innerHTML = posts.map(p => createPostCardHTML(p, false)).join('');
    } catch (err) { list.innerHTML = '<p class="empty-text error">Lỗi tải dữ liệu!</p>'; }
}

async function loadMyPosts() {
    const token = localStorage.getItem('access_token');
    const list = document.getElementById('miniMyPostsList');
    list.innerHTML = '<p class="empty-text">Đang tải...</p>';
    try {
        const res = await fetch(`${API_URL}/posts/my-posts`, { headers: { 'Authorization': `Bearer ${token}` } });
        const posts = await res.json();
        if (posts.length === 0) return list.innerHTML = '<p class="empty-text">Chưa có bài đăng nào.</p>';
        list.innerHTML = posts.map(p => createPostCardHTML(p, true)).join('');
    } catch (err) { list.innerHTML = '<p class="empty-text error">Lỗi API.</p>'; }
}

// ==========================================
// 6. ACTION: ĐĂNG BÀI & DUYỆT BÀI
// ==========================================
async function handleCreatePost() {
    const token = localStorage.getItem('access_token');
    const msgBox = document.getElementById('postMsg');
    const postData = {
        title: document.getElementById('postTitle').value,
        description: document.getElementById('postDesc').value,
        post_category: document.getElementById('postCat').value,
        products: [parseInt(document.getElementById('productCategory').value)],
        images: []
    };
    try {
        const res = await fetch(`${API_URL}/posts/`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(postData)
        });
        if (res.ok) {
            msgBox.className = "msg success"; msgBox.innerText = `Đăng bài thành công! Đang chờ duyệt.`;
            setTimeout(() => { closeModal('postModal'); loadGlobalPosts(); }, 1500);
        } else { msgBox.className = "msg error"; msgBox.innerText = "Lỗi dữ liệu"; }
    } catch (err) { msgBox.className = "msg error"; msgBox.innerText = "Lỗi Server!"; }
}

async function reviewPost(postId, action) {
    const token = localStorage.getItem('access_token');
    const bodyData = { action: action };
    
    if (action === 'reject') {
        const reason = prompt("Lý do từ chối bài đăng này:");
        if (reason === null) return;
        bodyData.reject_reason = reason;
    }

    try {
        const res = await fetch(`${API_URL}/posts/${postId}/approve`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(bodyData)
        });
        if (res.ok) { alert(`Đã cập nhật bài viết!`); loadGlobalPosts(); }
        else { alert("Lỗi khi duyệt bài!"); }
    } catch (err) { alert("Lỗi kết nối Server!"); }
}

function viewPostDetail(postId) {
    closeModal('profileModal');
    switchMainTab('tab-posts');
    currentPostFilterId = postId;
    document.getElementById('activeFilterText').classList.remove('hidden');
    loadGlobalPosts();
}
function clearFilter() {
    currentPostFilterId = null;
    document.getElementById('activeFilterText').classList.add('hidden');
    loadGlobalPosts();
}

// Khởi chạy
checkLoginStatus();