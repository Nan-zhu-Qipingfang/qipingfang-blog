// 交流墙增强功能模块

// 生成用户头像（基于用户 ID 的彩色头像）
function generateAvatar(userId, nickname, anonymous) {
    if (anonymous) {
        return `<div class="avatar-placeholder">👤</div>`;
    }
    
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];
    const colorIndex = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const bgColor = colors[colorIndex];
    const initial = (nickname || '匿').charAt(0);
    
    return `
        <div class="user-avatar" style="background: ${bgColor}">
            <span>${initial}</span>
        </div>
    `;
}

// 获取用户等级
function getUserLevel(userId) {
    const userPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]')
        .filter(p => p.userId === userId);
    const postCount = userPosts.length;
    
    if (postCount >= 50) return { name: '👑 传奇用户', level: 7, color: '#ffd700' };
    if (postCount >= 30) return { name: '💎 钻石用户', level: 6, color: '#b9f2ff' };
    if (postCount >= 20) return { name: '🥇 金牌用户', level: 5, color: '#ffb347' };
    if (postCount >= 10) return { name: '🥈 银牌用户', level: 4, color: '#c0c0c0' };
    if (postCount >= 5) return { name: '🥉 铜牌用户', level: 3, color: '#cd7f32' };
    if (postCount >= 2) return { name: '✨ 活跃用户', level: 2, color: '#9370db' };
    return { name: '🌱 新手用户', level: 1, color: '#90ee90' };
}

// 生成用户等级徽章
function generateLevelBadge(userId) {
    const level = getUserLevel(userId);
    return `<span class="level-badge" style="background: ${level.color}">${level.name}</span>`;
}

// 增强点赞功能（带动画）
function likeWallPostEnhanced(postId, userId) {
    const hasLiked = localStorage.getItem(`liked-wall-${postId}`) === 'true';
    const action = hasLiked ? 'remove' : 'add';
    
    // 更新本地存储
    localStorage.setItem(`liked-wall-${postId}`, !hasLiked);
    
    // 更新点赞数
    const allPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    const postIndex = allPosts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
        allPosts[postIndex].likes = (allPosts[postIndex].likes || 0) + (hasLiked ? -1 : 1);
        localStorage.setItem('wall-posts', JSON.stringify(allPosts));
    }
    
    // 触发动画
    const likeBtn = document.querySelector(`.wall-post[data-id="${postId}"] .like-btn`);
    if (likeBtn) {
        likeBtn.classList.add('like-animation');
        setTimeout(() => likeBtn.classList.remove('like-animation'), 1000);
    }
    
    // 重新渲染
    loadWallPosts();
}

// 帖子编辑功能
function editWallPost(postId) {
    const allPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    const post = allPosts.find(p => p.id === postId);
    
    if (!post) {
        showToast('帖子不存在');
        return;
    }
    
    // 验证是否是作者
    const userCode = localStorage.getItem('wall-userCode');
    if (post.userCode !== userCode) {
        showToast('只能编辑自己的帖子');
        return;
    }
    
    // 显示编辑表单
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="edit-modal-content">
            <h3>✏️ 编辑帖子</h3>
            <textarea id="edit-content">${escapeHtml(post.content)}</textarea>
            <div class="edit-actions">
                <button class="cancel-btn" onclick="closeEditModal()">取消</button>
                <button class="save-btn" onclick="saveEdit('${postId}')">保存</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('show');
}

function closeEditModal() {
    const modal = document.querySelector('.edit-modal');
    if (modal) modal.remove();
}

function saveEdit(postId) {
    const newContent = document.getElementById('edit-content').value.trim();
    
    if (!newContent) {
        showToast('内容不能为空');
        return;
    }
    
    const allPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    const postIndex = allPosts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
        allPosts[postIndex].content = newContent;
        allPosts[postIndex].edited = true;
        allPosts[postIndex].editTime = new Date().toLocaleString('zh-CN');
        localStorage.setItem('wall-posts', JSON.stringify(allPosts));
        
        closeEditModal();
        loadWallPosts();
        showToast('编辑成功');
    }
}

// 帖子删除功能
function deleteWallPost(postId) {
    const allPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    const post = allPosts.find(p => p.id === postId);
    
    if (!post) {
        showToast('帖子不存在');
        return;
    }
    
    // 验证是否是作者或管理员
    const userCode = localStorage.getItem('wall-userCode');
    const isAdmin = userCode === 'admin';
    
    if (post.userCode !== userCode && !isAdmin) {
        showToast('只能删除自己的帖子');
        return;
    }
    
    // 确认删除
    if (!confirm('确定要删除这个帖子吗？此操作不可恢复。')) {
        return;
    }
    
    // 删除帖子
    const postIndex = allPosts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
        allPosts.splice(postIndex, 1);
        localStorage.setItem('wall-posts', JSON.stringify(allPosts));
        loadWallPosts();
        showToast('删除成功');
    }
}

// 帖子收藏功能
function bookmarkWallPost(postId) {
    const bookmarks = JSON.parse(localStorage.getItem('wall-bookmarks') || '[]');
    const index = bookmarks.indexOf(postId);
    
    if (index !== -1) {
        bookmarks.splice(index, 1);
        localStorage.setItem('wall-bookmarks', JSON.stringify(bookmarks));
        showToast('已取消收藏');
    } else {
        bookmarks.push(postId);
        localStorage.setItem('wall-bookmarks', JSON.stringify(bookmarks));
        showToast('收藏成功');
    }
    
    // 更新按钮状态
    const bookmarkBtn = document.querySelector(`.wall-post[data-id="${postId}"] .bookmark-btn`);
    if (bookmarkBtn) {
        bookmarkBtn.classList.toggle('bookmarked');
    }
}

// 帖子举报功能
function reportWallPost(postId, reason = '') {
    const reports = JSON.parse(localStorage.getItem('wall-reports') || '[]');
    
    // 检查是否已举报
    const existingReport = reports.find(r => r.postId === postId && r.userCode === localStorage.getItem('wall-userCode'));
    if (existingReport) {
        showToast('你已经举报过这个帖子了');
        return;
    }
    
    const report = {
        postId,
        userCode: localStorage.getItem('wall-userCode') || 'anonymous',
        reason,
        date: new Date().toLocaleString('zh-CN')
    };
    
    reports.push(report);
    localStorage.setItem('wall-reports', JSON.stringify(reports));
    showToast('举报成功，感谢你的反馈');
}

// 帖子搜索功能
function searchWallPosts(query) {
    const allPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    
    if (!query) {
        loadWallPosts();
        return;
    }
    
    const filtered = allPosts.filter(post =>
        post.content.toLowerCase().includes(query.toLowerCase()) ||
        (post.nickname && post.nickname.toLowerCase().includes(query.toLowerCase())) ||
        (post.tags && post.tags.some(t => t.toLowerCase().includes(query.toLowerCase())))
    );
    
    renderWallPosts(filtered);
}

// 表情包支持
const emojiList = ['😀', '😂', '🥰', '😎', '🤔', '👍', '❤️', '🎉', '🔥', '✨', '💪', '🙏', '😊', '🤣', '👏', '💖'];

function insertEmoji(emoji) {
    const contentInput = document.getElementById('wall-content');
    if (contentInput) {
        contentInput.value += emoji;
        contentInput.focus();
    }
}

function toggleEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    if (picker) {
        picker.classList.toggle('show');
    }
}

function renderEmojiPicker() {
    const container = document.getElementById('emoji-picker');
    if (!container) return;
    
    container.innerHTML = `
        <div class="emoji-grid">
            ${emojiList.map(emoji => `
                <button class="emoji-btn" onclick="insertEmoji('${emoji}')">${emoji}</button>
            `).join('')}
        </div>
    `;
}

// @提及功能
function handleAtMention(input) {
    const cursorPos = input.selectionStart;
    const text = input.value;
    const beforeText = text.substring(0, cursorPos);
    const afterText = text.substring(cursorPos);
    
    // 查找最后的@符号
    const atIndex = beforeText.lastIndexOf('@');
    if (atIndex === -1) return;
    
    // 获取@后的文本
    const mentionText = beforeText.substring(atIndex + 1);
    
    // 显示提及建议
    showMentionSuggestions(mentionText, atIndex);
}

function showMentionSuggestions(query, position) {
    const allPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    const users = [...new Set(allPosts.map(p => p.nickname).filter(Boolean))];
    
    const filtered = users.filter(u => u.toLowerCase().includes(query.toLowerCase()));
    
    if (filtered.length === 0) {
        hideMentionSuggestions();
        return;
    }
    
    const suggestionsBox = document.getElementById('mention-suggestions');
    suggestionsBox.innerHTML = filtered.map(user => `
        <div class="mention-item" onclick="insertMention('${user}')">
            ${user}
        </div>
    `).join('');
    suggestionsBox.classList.add('show');
}

function hideMentionSuggestions() {
    const suggestionsBox = document.getElementById('mention-suggestions');
    if (suggestionsBox) suggestionsBox.classList.remove('show');
}

function insertMention(username) {
    const contentInput = document.getElementById('wall-content');
    const cursorPos = contentInput.selectionStart;
    const text = contentInput.value;
    const beforeText = text.substring(0, cursorPos);
    const afterText = text.substring(cursorPos);
    
    const atIndex = beforeText.lastIndexOf('@');
    const newText = text.substring(0, atIndex) + `@${username} ` + afterText;
    
    contentInput.value = newText;
    hideMentionSuggestions();
    contentInput.focus();
}

// 图片轮播预览
let currentImageIndex = 0;
let currentImages = [];

function viewImageEnhanced(images, index) {
    currentImages = images;
    currentImageIndex = index;
    
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('image-viewer-img');
    
    if (modal && img) {
        modal.classList.add('show');
        img.src = images[index];
        updateImageNavigation();
    }
}

function prevImage() {
    if (currentImages.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    document.getElementById('image-viewer-img').src = currentImages[currentImageIndex];
    updateImageNavigation();
}

function nextImage() {
    if (currentImages.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % currentImages.length;
    document.getElementById('image-viewer-img').src = currentImages[currentImageIndex];
    updateImageNavigation();
}

function updateImageNavigation() {
    const indicator = document.getElementById('image-indicator');
    if (indicator) {
        indicator.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
    }
}

// 帖子置顶功能（管理员）
function pinWallPost(postId) {
    const allPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    const postIndex = allPosts.findIndex(p => p.id === postId);
    
    if (postIndex === -1) return;
    
    // 检查管理员权限
    const userCode = localStorage.getItem('wall-userCode');
    if (userCode !== 'admin') {
        showToast('只有管理员可以置顶帖子');
        return;
    }
    
    allPosts[postIndex].pinned = !allPosts[postIndex].pinned;
    allPosts[postIndex].pinTime = new Date().toLocaleString('zh-CN');
    
    localStorage.setItem('wall-posts', JSON.stringify(allPosts));
    loadWallPosts();
    showToast(allPosts[postIndex].pinned ? '已置顶' : '已取消置顶');
}

// 用户签名功能
function getUserSignature(userId) {
    const signatures = JSON.parse(localStorage.getItem('wall-signatures') || '{}');
    return signatures[userId] || '';
}

function setUserSignature(signature) {
    const userCode = localStorage.getItem('wall-userCode');
    const userId = localStorage.getItem('wall-userId-' + userCode);
    
    if (!userId) {
        showToast('请先发帖获取用户 ID');
        return;
    }
    
    const signatures = JSON.parse(localStorage.getItem('wall-signatures') || '{}');
    signatures[userId] = signature;
    localStorage.setItem('wall-signatures', JSON.stringify(signatures));
    showToast('签名已更新');
}

function openSignatureModal() {
    const currentSignature = getUserSignature(localStorage.getItem('wall-userId-' + localStorage.getItem('wall-userCode')));
    
    const modal = document.createElement('div');
    modal.className = 'signature-modal';
    modal.innerHTML = `
        <div class="signature-modal-content">
            <h3>✏️ 设置个性签名</h3>
            <input type="text" id="signature-input" value="${escapeHtml(currentSignature)}" placeholder="输入你的个性签名..." maxlength="50">
            <div class="edit-actions">
                <button class="cancel-btn" onclick="closeSignatureModal()">取消</button>
                <button class="save-btn" onclick="saveSignature()">保存</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('show');
}

function closeSignatureModal() {
    const modal = document.querySelector('.signature-modal');
    if (modal) modal.remove();
}

function saveSignature() {
    const signature = document.getElementById('signature-input').value.trim();
    setUserSignature(signature);
    closeSignatureModal();
}

// 导出函数到 window 对象
window.likeWallPostEnhanced = likeWallPostEnhanced;
window.editWallPost = editWallPost;
window.closeEditModal = closeEditModal;
window.saveEdit = saveEdit;
window.deleteWallPost = deleteWallPost;
window.bookmarkWallPost = bookmarkWallPost;
window.reportWallPost = reportWallPost;
window.searchWallPosts = searchWallPosts;
window.insertEmoji = insertEmoji;
window.toggleEmojiPicker = toggleEmojiPicker;
window.renderEmojiPicker = renderEmojiPicker;
window.handleAtMention = handleAtMention;
window.hideMentionSuggestions = hideMentionSuggestions;
window.insertMention = insertMention;
window.viewImageEnhanced = viewImageEnhanced;
window.prevImage = prevImage;
window.nextImage = nextImage;
window.pinWallPost = pinWallPost;
window.openSignatureModal = openSignatureModal;
window.closeSignatureModal = closeSignatureModal;
window.saveSignature = saveSignature;
window.generateAvatar = generateAvatar;
window.getUserLevel = getUserLevel;
window.generateLevelBadge = generateLevelBadge;
