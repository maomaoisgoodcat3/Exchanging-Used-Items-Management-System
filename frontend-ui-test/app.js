const API_URL = 'http://127.0.0.1:8000/api/v1';
let currentUserRole = "Guest"; 
let currentPostFilterId = null; 
let allFetchedPosts = []; 
let isLoginMode = true; // Thêm dòng này để theo dõi trạng thái Đăng nhập hay Đăng ký
document.addEventListener('DOMContentLoaded', () => {
    checkLoginAndServerStatus();
    if(document.getElementById('dynamicProductList')) addProductRow();
});

// ==========================================
// 1. QUẢN LÝ PHIÊN (SESSION) & SERVER CHECK
// ==========================================
async function checkLoginAndServerStatus() {
    const token = sessionStorage.getItem('access_token');
    const email = sessionStorage.getItem('user_email');
    
    if (token && email) {
        try {
            const res = await fetch(`${API_URL}/posts/my-posts`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Token lỗi");
            
            const adminRes = await fetch(`${API_URL}/posts/admin-all`, { headers: { 'Authorization': `Bearer ${token}` } });
            currentUserRole = adminRes.ok ? "Admin" : "Member";

            document.getElementById('btnOpenAuth').classList.add('hidden');
            document.getElementById('btnOpenPost').classList.remove('hidden');
            document.getElementById('btnProfile').innerText = `👤 ${email}`;
            document.getElementById('btnProfile').classList.remove('hidden');

            if (currentUserRole === 'Admin') document.getElementById('filterApproval').classList.remove('hidden');

        } catch(e) { handleLogout(false); }
    } else { handleLogout(false); }
    loadGlobalPosts(); 
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('authTitle');
    const hint = document.getElementById('authToggleHint');
    const btn = document.getElementById('btnSubmitAuth');
    const msgBox = document.getElementById('authMsg');
    
    msgBox.style.display = 'none'; // Giấu thông báo lỗi cũ
    
    if (isLoginMode) {
        title.innerText = "Đăng Nhập";
        hint.innerText = "Chưa có tài khoản? Đăng ký ngay";
        btn.innerText = "Xác Nhận Đăng Nhập";
        document.getElementById('authName').classList.add('hidden');
        document.getElementById('authPhone').classList.add('hidden');
    } else {
        title.innerText = "Đăng Ký Tài Khoản";
        hint.innerText = "Đã có tài khoản? Đăng nhập";
        btn.innerText = "Đăng Ký";
        document.getElementById('authName').classList.remove('hidden');
        document.getElementById('authPhone').classList.remove('hidden');
    }
}

async function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;
    const msgBox = document.getElementById('authMsg');

    if (isLoginMode) {
        // LOGIC ĐĂNG NHẬP
        const formData = new URLSearchParams();
        formData.append('username', email); 
        formData.append('password', pass);

        try {
            const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                sessionStorage.setItem('access_token', data.access_token);
                sessionStorage.setItem('user_email', email);
                closeModal('authModal');
                await checkLoginAndServerStatus(); 
                alert("Đăng nhập thành công!");
            } else { 
                msgBox.className = "msg error"; 
                msgBox.innerText = data.detail; 
            }
        } catch (err) { 
            msgBox.className = "msg error"; 
            msgBox.innerText = "Lỗi kết nối Server!"; 
        }
    } else {
        // LOGIC ĐĂNG KÝ
        const name = document.getElementById('authName').value;
        const phone = document.getElementById('authPhone').value;
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, name: name, password: pass, phone: phone })
            });
            const data = await res.json();
            if (res.ok) {
                msgBox.className = "msg success"; 
                msgBox.innerText = "Đăng ký thành công! Đang chuyển sang Đăng nhập...";
                setTimeout(() => toggleAuthMode(), 1500); // Tự động quay về form Đăng nhập
            } else { 
                msgBox.className = "msg error"; 
                msgBox.innerText = data.detail || "Lỗi đăng ký"; 
            }
        } catch (err) { 
            msgBox.className = "msg error"; 
            msgBox.innerText = "Lỗi Server!"; 
        }
    }
}

function handleLogout(showAlert = true) {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user_email');
    currentUserRole = "Guest";
    document.getElementById('btnOpenAuth').classList.remove('hidden');
    document.getElementById('btnOpenPost').classList.add('hidden');
    document.getElementById('btnProfile').classList.add('hidden');
    document.getElementById('filterApproval').classList.add('hidden');
    closeModal('profileModal');
    switchMainTab('tab-posts');
    if(showAlert) alert("Đã đăng xuất!");
    loadGlobalPosts();
}

// ==========================================
// 2. GIAO DIỆN CHUNG
// ==========================================
function switchMainTab(tabId) {
    document.querySelectorAll('.main-tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.sidebar-menu .side-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    const targetBtn = document.querySelector(`.side-btn[onclick*="${tabId}"]`);
    if(targetBtn) targetBtn.classList.add('active');
}

function switchProfileTab(tabId) {
    document.querySelectorAll('.prof-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.prof-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.prof-tab-btn[onclick*="${tabId}"]`).classList.add('active');
    if(tabId === 'prof-myposts') loadMyPosts();
}

function openModal(id) { 
    document.getElementById(id).classList.add('active'); 
    document.querySelectorAll('.msg').forEach(msg => {
        msg.style.display = 'none';
        msg.className = 'msg';
        msg.innerText = '';
    });
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// ==========================================
// 3. TẠO SẢN PHẨM ĐỘNG & ĐĂNG BÀI
// ==========================================
let productRowCount = 0;
function addProductRow() {
    productRowCount++;
    const rowHTML = `
        <div class="product-row" id="prodRow_${productRowCount}" style="background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 10px; margin-bottom: 10px;">
            <input type="text" class="p-name" placeholder="Tên sản phẩm (VD: Áo phông UET...)" style="width: 100%; margin-bottom: 8px; font-weight: bold;">
            
            <div style="display: flex; gap: 8px; width: 100%;">
                <select class="p-cat" style="flex: 2;">
                    <option value="1">Dụng cụ học tập</option>
                    <option value="2">Quần áo</option>
                    <option value="3">Đồ dùng</option>
                </select>
                <input type="number" class="p-qty" placeholder="SL" value="1" min="1" style="width: 70px;">
                <input type="number" class="p-price" placeholder="Giá (đ)" value="0" min="0" style="flex: 1.5;">
                <button class="btn btn-danger" style="padding: 5px 12px;" onclick="document.getElementById('prodRow_${productRowCount}').remove()" title="Xóa món này">Xóa</button>
            </div>
        </div>
    `;
    document.getElementById('dynamicProductList').insertAdjacentHTML('beforeend', rowHTML);
}

async function handleCreatePost() {
    const token = sessionStorage.getItem('access_token');
    const email = sessionStorage.getItem('user_email');
    const msgBox = document.getElementById('postMsg');

    // Gom Product List (Đảm bảo match với ProductItemCreate schema)
    const productsArr = [];
    document.querySelectorAll('.product-row').forEach(row => {
        productsArr.push({
            product_name: row.querySelector('.p-name').value || "Chưa đặt tên",
            product_category_id: parseInt(row.querySelector('.p-cat').value),
            product_quantity: parseInt(row.querySelector('.p-qty').value) || 1,
            product_price: parseFloat(row.querySelector('.p-price').value) || 0
        });
    });

    if(productsArr.length === 0) return alert("Phải có ít nhất 1 sản phẩm!");

    const imageUrl = document.getElementById('postImage').value;
    const imagesArr = imageUrl ? [{ image_url: imageUrl }] : [];

    const postData = {
        title: document.getElementById('postTitle').value,
        description: document.getElementById('postDesc').value,
        post_category: document.getElementById('postCat').value,
        seller_email: email,
        products: productsArr, 
        images: imagesArr
    };

    try {
        const res = await fetch(`${API_URL}/posts/`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(postData)
        });
        const data = await res.json();
        if (res.ok) {
            msgBox.className = "msg success"; msgBox.innerText = `Đăng bài thành công! Đang chờ duyệt.`;
            setTimeout(() => { 
                closeModal('postModal'); 
                loadGlobalPosts(); 
                document.getElementById('postTitle').value = ''; 
                document.getElementById('postDesc').value = '';
                document.getElementById('postImage').value = ''; // Reset luôn cả ô ảnh
                document.getElementById('dynamicProductList').innerHTML = ''; 
                addProductRow();
                
                // Ép xóa sạch thông báo để lần sau mở lên không bị dính
                msgBox.className = "msg";
                msgBox.innerText = "";
                msgBox.style.display = "none";
            }, 1500);
        } else { msgBox.className = "msg error"; msgBox.innerText = "Lỗi dữ liệu: " + JSON.stringify(data.detail); }
    } catch (err) { msgBox.className = "msg error"; msgBox.innerText = "Lỗi Server!"; }
}

// ==========================================
// 4. HIỂN THỊ, DUYỆT BÀI & ĐÓNG/MỞ
// ==========================================
function createPostCardHTML(p, isMini = false) {
    const status = p.status || 'Approved';
    const isClosed = p.open_status === 'Closed' || status === 'Rejected';
    const dotClass = isClosed ? 'dot-closed' : 'dot-available';
    const openStatusText = p.open_status === 'Closed' ? 'Đã đóng' : 'Sẵn sàng';
    
    let approvalTag = (currentUserRole === 'Admin' || isMini) ? 
        `<span class="filter-badge" style="background:${status==='Pending'?'#ffc107':(status==='Approved'?'#198754':'#dc3545')}; color:${status==='Pending'?'black':'white'}">${status}</span>` : '';
    let rejectionNotice = (status === 'Rejected' && p.rejection_reason && (currentUserRole === 'Admin' || isMini)) ? 
        `<div style="color:#842029; font-size:12px; margin-top:5px; background:#f8d7da; padding:5px; border-radius:4px;"><b>Lý do từ chối:</b> ${p.rejection_reason}</div>` : '';

    if (isMini) {
        // Nút Owner tự Đóng/Mở bài viết
        const toggleText = p.open_status === 'Available' ? '🔒 Đóng bài viết' : '🔓 Mở lại bài';
        const toggleColor = p.open_status === 'Available' ? 'btn-danger' : 'btn-primary';
        
        return `<div style="border-bottom: 1px solid #eee; padding: 15px 0;">
                <b style="cursor:pointer;" onclick="viewPostDetail(${p.post_id})">${p.title}</b>
                <div style="font-size: 12px; margin-top: 5px;"><span class="status-dot ${dotClass}"></span>${openStatusText} ${approvalTag}</div>
                ${rejectionNotice}
                <div style="margin-top: 10px;">
                    <button class="btn ${toggleColor}" style="padding: 3px 10px; font-size: 12px;" onclick="togglePostOpenStatus(${p.post_id}, event)">${toggleText}</button>
                </div>
            </div>`;
    }

    let actionButtons = '';
    if (currentUserRole === 'Admin') {
        actionButtons = `
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc;">
                <button class="btn btn-primary" style="padding: 5px 15px; font-size: 13px;" onclick="reviewPost(${p.post_id}, 'approve')">✅ Duyệt</button>
                <button class="btn btn-danger" style="padding: 5px 15px; font-size: 13px; margin-left: 10px;" onclick="reviewPost(${p.post_id}, 'reject')">❌ Từ chối</button>
            </div>
        `;
    }

    return `<div style="background:white; padding:15px; border-radius:8px; border:1px solid #ddd; margin-bottom:15px; opacity:${isClosed && currentUserRole !== 'Admin' ? '0.6' : '1'}">
            <div style="margin-bottom:10px;"><span class="status-dot ${dotClass}"></span> <span style="font-size: 13px; font-weight: bold; color: #555;">${openStatusText}</span> ${approvalTag}</div>
            <h3 style="margin: 0 0 5px;">${p.title}</h3>
            <p style="font-size: 13px; color: #666;">Đăng bởi: ${p.seller_email} | Nhãn: ${p.post_category}</p>
            <p style="font-size: 14px;">${p.description}</p>
            ${rejectionNotice}
            ${actionButtons}
        </div>`;
}

// Gọi API toggle Open/Close
async function togglePostOpenStatus(postId, event) {
    if(event) event.stopPropagation();
    const token = sessionStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/toggle-status`, {
            method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) { loadMyPosts(); loadGlobalPosts(); }
        else { alert("Lỗi khi thay đổi trạng thái!"); }
    } catch (e) { alert("Lỗi Server"); }
}

async function reviewPost(postId, action) {
    const token = sessionStorage.getItem('access_token');
    const bodyData = { action: action };
    if (action === 'reject') {
        const reason = prompt("Lý do từ chối bài đăng này:");
        if (reason === null) return;
        bodyData.reject_reason = reason;
    }
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/approve`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(bodyData)
        });
        if (res.ok) loadGlobalPosts(); else alert("Lỗi thao tác!");
    } catch (err) { alert("Lỗi kết nối!"); }
}

// ==========================================
// 5. LỌC NÂNG CAO VÀ RENDER CHỢ CHUNG
// ==========================================
async function loadGlobalPosts() {
    const list = document.getElementById('globalPostsList');
    try {
        let apiUrl = currentUserRole === 'Admin' ? `${API_URL}/posts/admin-all` : `${API_URL}/posts/`;
        let options = currentUserRole === 'Admin' ? { headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` } } : {};
        
        const res = await fetch(apiUrl, options);
        if(res.status === 403) throw new Error("403"); // Bảo vệ lỗi 403 báo đỏ
        allFetchedPosts = await res.json();
        renderFilteredPosts();
    } catch (err) { list.innerHTML = '<p class="empty-text error">Lỗi tải dữ liệu. Hãy thử đăng nhập lại.</p>'; }
}

function renderFilteredPosts() {
    const list = document.getElementById('globalPostsList');
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('filterType').value;
    const openStatusFilter = document.getElementById('filterOpenStatus').value;
    const approvalFilter = document.getElementById('filterApproval').value;
    const sortType = document.getElementById('sortSelect').value;

    let filtered = [...allFetchedPosts];

    if (currentPostFilterId) {
        filtered = filtered.filter(p => p.post_id === currentPostFilterId);
        document.getElementById('activeFilterText').innerText = `(Lọc ID: ${currentPostFilterId})`;
        document.getElementById('activeFilterText').classList.remove('hidden');
    } else { document.getElementById('activeFilterText').classList.add('hidden'); }

    if (keyword) filtered = filtered.filter(p => p.title.toLowerCase().includes(keyword) || (p.description && p.description.toLowerCase().includes(keyword)));
    if (typeFilter) filtered = filtered.filter(p => p.post_category === typeFilter);
    if (openStatusFilter) filtered = filtered.filter(p => p.open_status === openStatusFilter);
    if (currentUserRole === 'Admin' && approvalFilter) filtered = filtered.filter(p => p.status === approvalFilter);

    if (sortType === 'newest') filtered.sort((a,b) => b.post_id - a.post_id);
    else filtered.sort((a,b) => a.post_id - b.post_id);

    if (filtered.length === 0) list.innerHTML = '<p class="empty-text">Không tìm thấy bài viết.</p>';
    else list.innerHTML = filtered.map(p => createPostCardHTML(p, false)).join('');
}

function handleFilterSort() { renderFilteredPosts(); }
function clearAllFilters() {
    currentPostFilterId = null;
    document.getElementById('searchInput').value = ''; document.getElementById('filterType').value = '';
    document.getElementById('filterOpenStatus').value = ''; document.getElementById('filterApproval').value = '';
    document.getElementById('sortSelect').value = 'newest';
    renderFilteredPosts();
}

function viewPostDetail(postId) {
    closeModal('profileModal'); switchMainTab('tab-posts');
    currentPostFilterId = postId; renderFilteredPosts();
}

async function loadMyPosts() {
    const token = sessionStorage.getItem('access_token');
    const list = document.getElementById('miniMyPostsList');
    const res = await fetch(`${API_URL}/posts/my-posts`, { headers: { 'Authorization': `Bearer ${token}` } });
    const posts = await res.json();
    if(posts.length === 0) return list.innerHTML = '<p class="empty-text">Bạn chưa có bài đăng nào.</p>';
    list.innerHTML = posts.map(p => createPostCardHTML(p, true)).join('');
}