// 后台管理逻辑

// 全局变量
let posts = [];
let wallPosts = [];
let allComments = [];
let deleteCallback = null;
let operationLogs = [];
let selectedPosts = [];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    setupLogin();
    setupNavigation();
    setupPostForm();
    setupSettings();
    loadLogs();
});

// 检查登录状态
function checkLogin() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        showAdminPanel();
        loadAllData();
    }
}

// 设置登录表单
function setupLogin() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('admin-user').value.trim();
        const password = document.getElementById('admin-pass').value.trim();
        
        const adminUser = localStorage.getItem('adminUser') || 'admin';
        const adminPass = localStorage.getItem('adminPass') || 'admin123';
        
        if (username === adminUser && password === adminPass) {
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminName', username);
            logOperation('登录', '管理员登录系统');
            showAdminPanel();
            loadAllData();
        } else {
            alert('用户名或密码错误');
        }
    });
}

// 显示管理面板
function showAdminPanel() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'grid';
    document.getElementById('admin-name').textContent = localStorage.getItem('adminName') || '管理员';
}

// 退出登录
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('确定要退出登录吗？')) {
                logOperation('退出登录', '管理员退出系统');
                localStorage.removeItem('adminLoggedIn');
                localStorage.removeItem('adminName');
                location.reload();
            }
        });
    }
});

// 设置导航
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            
            if (tab === 'dashboard') {
                loadAllData();
            }
            
            showTab(tab);
        });
    });
}

// 切换标签页
function showTab(tab) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tab) {
            item.classList.add('active');
        }
    });
    
    const titles = {
        'dashboard': '控制台',
        'posts': '文章管理',
        'wall': '交流墙管理',
        'pending': '审核队列',
        'comments': '评论管理',
        'users': '用户管理',
        'logs': '操作日志',
        'export': '数据导出',
        'settings': '系统设置',
        'editor': '文章编辑'
    };
    document.getElementById('page-title').textContent = titles[tab] || '管理后台';
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetTab = document.getElementById(`tab-${tab}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    switch(tab) {
        case 'posts':
            renderPostsTable();
            break;
        case 'wall':
            renderWallTable();
            break;
        case 'pending':
            renderPendingTable();
            break;
        case 'comments':
            renderCommentsTable();
            break;
        case 'users':
            renderUsersTable();
            break;
        case 'logs':
            renderLogsTable();
            break;
    }
}

// 加载所有数据
function loadAllData() {
    loadPosts();
    loadWallPosts();
    loadAllComments();
    updateStats();
}

// 加载文章
async function loadPosts() {
    try {
        const response = await fetch('posts/posts.json');
        posts = await response.json();
    } catch (error) {
        console.error('加载文章失败:', error);
        posts = [];
    }
}

// 加载交流墙帖子
function loadWallPosts() {
    wallPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
}

// 加载所有评论
function loadAllComments() {
    allComments = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('comments-')) {
            const article = key.replace('comments-', '');
            const comments = JSON.parse(localStorage.getItem(key) || '[]');
            comments.forEach(comment => {
                allComments.push({
                    article,
                    ...comment
                });
            });
        }
    }
}

// 更新统计数据
function updateStats() {
    document.getElementById('stat-posts').textContent = posts.length;
    document.getElementById('stat-wall').textContent = wallPosts.length;
    
    const totalComments = allComments.length;
    document.getElementById('stat-comments').textContent = totalComments;
    
    const uniqueUsers = new Set(wallPosts.map(p => p.userId)).size;
    document.getElementById('stat-users').textContent = uniqueUsers;
    
    const pendingCount = JSON.parse(localStorage.getItem('wall-posts-pending') || '[]').length;
    document.getElementById('stat-pending').textContent = pendingCount;
    document.getElementById('pending-badge').textContent = pendingCount;
    
    const views = JSON.parse(localStorage.getItem('site-views') || '0');
    document.getElementById('stat-views').textContent = views;
    
    renderRecentPosts();
    renderRecentWall();
}

// 渲染最近文章
function renderRecentPosts() {
    const tbody = document.getElementById('recent-posts-table');
    const recentPosts = posts.slice(0, 5);
    
    tbody.innerHTML = recentPosts.map(post => `
        <tr>
            <td>${post.title}</td>
            <td>${post.date}</td>
            <td>${post.tags ? post.tags.map(t => `<span class="tag">${t}</span>`).join('') : '-'}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-secondary" onclick="editPost('${post.file}')">编辑</button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeletePost('${post.file}')">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    if (recentPosts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">暂无文章</td></tr>';
    }
}

// 渲染最近交流墙帖子
function renderRecentWall() {
    const tbody = document.getElementById('recent-wall-table');
    const recentPosts = wallPosts.slice(0, 5);
    
    tbody.innerHTML = recentPosts.map(post => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="width: 30px; height: 30px; background: rgba(79,172,254,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">${post.anonymous ? '👤' : post.nickname.charAt(0).toUpperCase()}</span>
                    <span>${post.anonymous ? '匿名' : post.nickname}</span>
                </div>
            </td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${post.content}</td>
            <td>${post.date}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteWallPost('${post.userId}', '${post.date}')">删除</button>
            </td>
        </tr>
    `).join('');
    
    if (recentPosts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">暂无帖子</td></tr>';
    }
}

// 渲染文章管理表格
function renderPostsTable() {
    const tbody = document.getElementById('posts-table');
    selectedPosts = [];
    document.getElementById('select-all-posts').checked = false;
    
    tbody.innerHTML = posts.map((post, index) => `
        <tr>
            <td><input type="checkbox" class="post-checkbox" data-index="${index}" onchange="togglePostSelect(${index})"></td>
            <td>${post.title}</td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${post.excerpt}</td>
            <td>${post.date}</td>
            <td>${post.tags ? post.tags.map(t => `<span class="tag">${t}</span>`).join('') : '-'}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-secondary" onclick="editPost('${post.file}')">编辑</button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeletePost('${post.file}')">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    if (posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">暂无文章，点击右上角新建</td></tr>';
    }
}

function togglePostSelect(index) {
    const checkbox = document.querySelector(`.post-checkbox[data-index="${index}"]`);
    if (checkbox.checked) {
        selectedPosts.push(index);
    } else {
        selectedPosts = selectedPosts.filter(i => i !== index);
    }
}

function toggleSelectAll() {
    const selectAll = document.getElementById('select-all-posts').checked;
    const checkboxes = document.querySelectorAll('.post-checkbox');
    
    selectedPosts = [];
    checkboxes.forEach((cb, index) => {
        cb.checked = selectAll;
        if (selectAll) {
            selectedPosts.push(index);
        }
    });
}

function batchDeletePosts() {
    if (selectedPosts.length === 0) {
        alert('请先选择要删除的文章');
        return;
    }
    
    if (confirm(`确定要删除选中的 ${selectedPosts.length} 篇文章吗？`)) {
        selectedPosts.sort((a, b) => b - a).forEach(index => {
            posts.splice(index, 1);
        });
        downloadJSON('posts/posts.json', posts);
        logOperation('批量删除文章', `删除了 ${selectedPosts.length} 篇文章`);
        selectedPosts = [];
        renderPostsTable();
        updateStats();
    }
}

// 渲染交流墙表格
function renderWallTable() {
    const tbody = document.getElementById('wall-table');
    
    tbody.innerHTML = wallPosts.map((post, index) => `
        <tr>
            <td>${post.anonymous ? '匿名' : post.nickname}</td>
            <td style="font-family: monospace;">${post.userId}</td>
            <td>${post.category || 'general'}</td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${post.content}</td>
            <td>${post.likes || 0}</td>
            <td>${post.date}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteWallPostByIndex(${index})">删除</button>
            </td>
        </tr>
    `).join('');
    
    if (wallPosts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">暂无帖子</td></tr>';
    }
}

function searchWallPosts(event) {
    const query = event.target.value.toLowerCase();
    const rows = document.querySelectorAll('#wall-table tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

// 渲染审核队列
function renderPendingTable() {
    const pendingPosts = JSON.parse(localStorage.getItem('wall-posts-pending') || '[]');
    const tbody = document.getElementById('pending-table');
    
    tbody.innerHTML = pendingPosts.map((post, index) => `
        <tr>
            <td>${post.anonymous ? '匿名' : post.nickname}</td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${post.content}</td>
            <td>${post.date}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary" onclick="approvePost(${index})">通过</button>
                    <button class="btn btn-sm btn-danger" onclick="rejectPost(${index})">拒绝</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    if (pendingPosts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">暂无待审核内容</td></tr>';
    }
}

function approvePost(index) {
    const pendingPosts = JSON.parse(localStorage.getItem('wall-posts-pending') || '[]');
    const post = pendingPosts[index];
    
    const allPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    allPosts.unshift(post);
    localStorage.setItem('wall-posts', JSON.stringify(allPosts));
    
    pendingPosts.splice(index, 1);
    localStorage.setItem('wall-posts-pending', JSON.stringify(pendingPosts));
    
    logOperation('审核通过', `通过了一条帖子`);
    renderPendingTable();
    updateStats();
}

function rejectPost(index) {
    const pendingPosts = JSON.parse(localStorage.getItem('wall-posts-pending') || '[]');
    pendingPosts.splice(index, 1);
    localStorage.setItem('wall-posts-pending', JSON.stringify(pendingPosts));
    
    logOperation('审核拒绝', `拒绝了一条帖子`);
    renderPendingTable();
    updateStats();
}

// 渲染评论表格
function renderCommentsTable() {
    const tbody = document.getElementById('comments-table');
    
    tbody.innerHTML = allComments.map((comment, index) => `
        <tr>
            <td>${comment.article}</td>
            <td>${comment.name}</td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${comment.content}</td>
            <td>${comment.date}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteComment('${comment.article}', ${index})">删除</button>
            </td>
        </tr>
    `).join('');
    
    if (allComments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">暂无评论</td></tr>';
    }
}

// 渲染用户管理表格
function renderUsersTable() {
    const users = {};
    
    wallPosts.forEach(post => {
        if (!users[post.userId]) {
            users[post.userId] = {
                userId: post.userId,
                nickname: post.nickname,
                userCode: post.userCode,
                postCount: 0,
                firstPost: post.date
            };
        }
        users[post.userId].postCount++;
        if (new Date(post.date) < new Date(users[post.userId].firstPost)) {
            users[post.userId].firstPost = post.date;
        }
    });
    
    const tbody = document.getElementById('users-table');
    const usersArray = Object.values(users);
    
    tbody.innerHTML = usersArray.map(user => `
        <tr>
            <td style="font-family: monospace;">${user.userId}</td>
            <td>${user.nickname}</td>
            <td style="font-family: monospace;">${user.userCode}</td>
            <td>${user.postCount}</td>
            <td>${user.firstPost}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="banUser('${user.userId}')">禁用</button>
            </td>
        </tr>
    `).join('');
    
    if (usersArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">暂无用户数据</td></tr>';
    }
}

function banUser(userId) {
    if (confirm(`确定要禁用用户 ${userId} 吗？`)) {
        const bannedUsers = JSON.parse(localStorage.getItem('banned-users') || '[]');
        if (!bannedUsers.includes(userId)) {
            bannedUsers.push(userId);
            localStorage.setItem('banned-users', JSON.stringify(bannedUsers));
            logOperation('禁用用户', `禁用了用户 ${userId}`);
            alert('用户已禁用');
        }
    }
}

// 渲染操作日志
function renderLogsTable() {
    const tbody = document.getElementById('logs-table');
    
    tbody.innerHTML = operationLogs.map(log => `
        <tr>
            <td>${log.time}</td>
            <td>${log.action}</td>
            <td>${log.detail}</td>
        </tr>
    `).join('');
    
    if (operationLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">暂无操作日志</td></tr>';
    }
}

function loadLogs() {
    operationLogs = JSON.parse(localStorage.getItem('operation-logs') || '[]');
}

function logOperation(action, detail) {
    operationLogs.unshift({
        time: new Date().toLocaleString('zh-CN'),
        action,
        detail
    });
    
    // 只保留最近 100 条日志
    operationLogs = operationLogs.slice(0, 100);
    localStorage.setItem('operation-logs', JSON.stringify(operationLogs));
}

function clearLogs() {
    if (confirm('确定要清空所有操作日志吗？')) {
        operationLogs = [];
        localStorage.removeItem('operation-logs');
        renderLogsTable();
    }
}

// 显示编辑器
function showEditor() {
    document.getElementById('editor-title').textContent = '新建文章';
    document.getElementById('post-form').reset();
    document.getElementById('edit-filename').value = '';
    document.getElementById('post-date').value = new Date().toISOString().split('T')[0];
    showTab('editor');
}

// 编辑文章
async function editPost(filename) {
    try {
        const response = await fetch(`posts/${filename}`);
        const markdown = await response.text();
        
        const post = posts.find(p => p.file === filename);
        if (post) {
            document.getElementById('editor-title').textContent = '编辑文章';
            document.getElementById('edit-filename').value = filename;
            document.getElementById('post-title').value = post.title;
            document.getElementById('post-excerpt').value = post.excerpt;
            document.getElementById('post-date').value = post.date;
            document.getElementById('post-tags').value = post.tags ? post.tags.join(', ') : '';
            document.getElementById('post-content').value = markdown;
            showTab('editor');
        }
    } catch (error) {
        console.error('加载文章失败:', error);
        alert('加载文章失败');
    }
}

// 设置文章表单
function setupPostForm() {
    const form = document.getElementById('post-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const filename = document.getElementById('edit-filename').value;
        const title = document.getElementById('post-title').value.trim();
        const excerpt = document.getElementById('post-excerpt').value.trim();
        const date = document.getElementById('post-date').value;
        const tagsInput = document.getElementById('post-tags').value.trim();
        const content = document.getElementById('post-content').value.trim();
        
        const tags = tagsInput ? tagsInput.split(/[,，]/).map(t => t.trim()).filter(t => t) : [];
        const file = filename || `${Date.now()}.md`;
        
        const postData = { title, file, excerpt, date, tags };
        
        if (filename) {
            const index = posts.findIndex(p => p.file === filename);
            if (index !== -1) {
                posts[index] = postData;
                logOperation('编辑文章', `编辑了文章 "${title}"`);
            }
        } else {
            posts.unshift(postData);
            logOperation('新建文章', `创建了文章 "${title}"`);
        }
        
        downloadJSON('posts/posts.json', posts);
        downloadFile(`posts/${file}`, content);
        
        alert('文章已保存！请手动将生成的文件保存到 posts 文件夹。');
        showTab('posts');
        loadAllData();
    });
}

// 下载 JSON 文件
function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// 下载文件
function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// 确认删除文章
function confirmDeletePost(filename) {
    const modal = document.getElementById('confirm-modal');
    const message = document.getElementById('confirm-message');
    message.textContent = '确定要删除这篇文章吗？此操作不可恢复。';
    modal.classList.add('show');
    
    deleteCallback = () => {
        const post = posts.find(p => p.file === filename);
        posts = posts.filter(p => p.file !== filename);
        downloadJSON('posts/posts.json', posts);
        logOperation('删除文章', `删除了文章 "${post?.title}"`);
        modal.classList.remove('show');
        loadAllData();
        renderPostsTable();
    };
    
    document.getElementById('confirm-delete-btn').onclick = deleteCallback;
}

// 确认删除交流墙帖子
function confirmDeleteWallPostByIndex(index) {
    const modal = document.getElementById('confirm-modal');
    const message = document.getElementById('confirm-message');
    message.textContent = '确定要删除这条帖子吗？';
    modal.classList.add('show');
    
    deleteCallback = () => {
        const post = wallPosts[index];
        wallPosts.splice(index, 1);
        localStorage.setItem('wall-posts', JSON.stringify(wallPosts));
        logOperation('删除帖子', `删除了用户 ${post?.nickname} 的帖子`);
        modal.classList.remove('show');
        loadAllData();
        renderWallTable();
    };
    
    document.getElementById('confirm-delete-btn').onclick = deleteCallback;
}

// 确认删除评论
function confirmDeleteComment(article, index) {
    const modal = document.getElementById('confirm-modal');
    const message = document.getElementById('confirm-message');
    message.textContent = '确定要删除这条评论吗？';
    modal.classList.add('show');
    
    deleteCallback = () => {
        const key = `comments-${article}`;
        const comments = JSON.parse(localStorage.getItem(key) || '[]');
        const comment = comments[index];
        comments.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(comments));
        logOperation('删除评论', `删除了用户 ${comment?.name} 的评论`);
        modal.classList.remove('show');
        loadAllComments();
        renderCommentsTable();
        updateStats();
    };
    
    document.getElementById('confirm-delete-btn').onclick = deleteCallback;
}

// 关闭模态框
function closeModal() {
    document.getElementById('confirm-modal').classList.remove('show');
}

// 设置系统设置
function setupSettings() {
    const form = document.getElementById('settings-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('setting-title').value.trim();
        const subtitle = document.getElementById('setting-subtitle').value.trim();
        const admin = document.getElementById('setting-admin').value.trim();
        const password = document.getElementById('setting-password').value.trim();
        
        if (title) {
            localStorage.setItem('blogTitle', title);
            logOperation('系统设置', `修改了博客标题为 "${title}"`);
        }
        if (subtitle) {
            localStorage.setItem('blogSubtitle', subtitle);
            logOperation('系统设置', `修改了副标题为 "${subtitle}"`);
        }
        if (admin) {
            localStorage.setItem('adminUser', admin);
            logOperation('系统设置', `修改了管理员账号为 "${admin}"`);
        }
        if (password) {
            localStorage.setItem('adminPass', password);
            logOperation('系统设置', '修改了管理员密码');
        }
        
        alert('设置已保存！');
    });
}

// 导出数据
function exportData() {
    const exportPosts = document.getElementById('export-posts').checked;
    const exportWall = document.getElementById('export-wall').checked;
    const exportComments = document.getElementById('export-comments').checked;
    const exportUsers = document.getElementById('export-users').checked;
    const exportLogs = document.getElementById('export-logs').checked;
    
    const exportData = {
        exportTime: new Date().toLocaleString('zh-CN'),
        blogTitle: localStorage.getItem('blogTitle') || '七平方の Blog'
    };
    
    if (exportPosts) exportData.posts = posts;
    if (exportWall) exportData.wallPosts = wallPosts;
    if (exportComments) exportData.comments = allComments;
    if (exportUsers) {
        const users = {};
        wallPosts.forEach(post => {
            if (!users[post.userId]) {
                users[post.userId] = {
                    userId: post.userId,
                    nickname: post.nickname,
                    userCode: post.userCode,
                    postCount: 0
                };
            }
            users[post.userId].postCount++;
        });
        exportData.users = Object.values(users);
    }
    if (exportLogs) exportData.logs = operationLogs;
    
    downloadJSON(`blog-backup-${Date.now()}.json`, exportData);
    logOperation('数据导出', '导出了博客数据');
}

// 全局函数暴露
window.showTab = showTab;
window.showEditor = showEditor;
window.editPost = editPost;
window.confirmDeletePost = confirmDeletePost;
window.confirmDeleteWallPostByIndex = confirmDeleteWallPostByIndex;
window.confirmDeleteComment = confirmDeleteComment;
window.closeModal = closeModal;
window.togglePostSelect = togglePostSelect;
window.toggleSelectAll = toggleSelectAll;
window.batchDeletePosts = batchDeletePosts;
window.searchWallPosts = searchWallPosts;
window.approvePost = approvePost;
window.rejectPost = rejectPost;
window.banUser = banUser;
window.clearLogs = clearLogs;
window.exportData = exportData;
