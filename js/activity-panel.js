// 全站动态面板功能模块

let currentActivityTab = 'all';
let currentCalendarDate = new Date();

// 切换动态面板显示
function toggleActivityPanel() {
    const panel = document.getElementById('activity-panel');
    const overlay = document.getElementById('activity-panel-overlay');
    
    if (panel.classList.contains('show')) {
        panel.classList.remove('show');
        overlay.classList.remove('show');
        setTimeout(() => {
            panel.style.display = 'none';
        }, 400);
    } else {
        panel.style.display = 'flex';
        // 强制重绘
        panel.offsetHeight;
        panel.classList.add('show');
        overlay.classList.add('show');
        loadActivityData();
    }
}

// 切换活动标签页
function switchActivityTab(tab) {
    currentActivityTab = tab;
    
    document.querySelectorAll('.activity-tab').forEach(t => {
        t.classList.remove('active');
        if (t.dataset.tab === tab) {
            t.classList.add('active');
        }
    });
    
    loadActivityData();
}

// 加载动态数据
function loadActivityData() {
    loadStats();
    loadRecentComments();
    loadRecentViews();
    renderCalendar();
    loadActivityTags();
}

// 加载统计信息
function loadStats() {
    // 从 localStorage 获取访问次数
    let views = localStorage.getItem('site-views') || 0;
    views = parseInt(views) + Math.floor(Math.random() * 10);
    localStorage.setItem('site-views', views);

    // 获取文章数量
    const postsCount = posts ? posts.length : 0;

    // 获取评论数量
    const comments = JSON.parse(localStorage.getItem('site-comments') || '[]');
    const wallPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    const commentsCount = comments.length + wallPosts.reduce((acc, post) => acc + (post.replies?.length || 0), 0);

    // 计算热度（综合指标）
    const hotValue = views + postsCount * 100 + commentsCount * 50;
    
    // 获取标签数量
    const tagCount = new Set();
    if (posts) {
        posts.forEach(post => {
            if (post.tags) {
                post.tags.forEach(tag => tagCount.add(tag));
            }
        });
    }

    // 更新动态面板统计
    const statViews = document.getElementById('stat-views');
    const statPosts = document.getElementById('stat-posts');
    const statComments = document.getElementById('stat-comments');
    const statHot = document.getElementById('stat-hot');
    
    if (statViews) statViews.textContent = formatNumber(views);
    if (statPosts) statPosts.textContent = formatNumber(postsCount);
    if (statComments) statComments.textContent = formatNumber(commentsCount);
    if (statHot) statHot.textContent = formatNumber(hotValue);
    
    // 更新导航栏统计
    const navPostCount = document.getElementById('nav-post-count');
    const navTagCount = document.getElementById('nav-tag-count');
    const navHotCount = document.getElementById('nav-hot-count');
    
    if (navPostCount) navPostCount.textContent = formatNumber(postsCount);
    if (navTagCount) navTagCount.textContent = formatNumber(tagCount.size);
    if (navHotCount) navHotCount.textContent = formatNumber(hotValue);
}

// 格式化数字
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// 加载最新评论
function loadRecentComments() {
    const container = document.getElementById('recent-comments');
    const comments = [];
    
    // 从文章评论获取
    const articleComments = JSON.parse(localStorage.getItem('site-comments') || '[]');
    articleComments.forEach(comment => {
        comments.push({
            author: comment.name,
            text: comment.content,
            time: comment.date,
            type: 'article',
            article: comment.article
        });
    });
    
    // 从交流墙获取
    const wallPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    wallPosts.forEach(post => {
        if (post.replies && post.replies.length > 0) {
            post.replies.forEach(reply => {
                comments.push({
                    author: reply.name,
                    text: reply.content,
                    time: reply.date,
                    type: 'wall',
                    post: post
                });
            });
        }
    });
    
    // 按时间排序并取最新 10 条
    comments.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentComments = comments.slice(0, 10);
    
    if (recentComments.length === 0) {
        container.innerHTML = `
            <div class="activity-empty">
                <div class="activity-empty-icon">💬</div>
                <div class="activity-empty-text">暂无评论</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentComments.map(comment => {
        const avatar = comment.author.charAt(0).toUpperCase();
        const timeAgo = getTimeAgo(comment.time);
        
        return `
            <div class="comment-item" onclick="${comment.type === 'article' ? `loadArticle('${comment.article}', '')` : 'toggleActivityPanel()'}">
                <div class="comment-avatar">${avatar}</div>
                <div class="comment-content">
                    <div class="comment-author">${escapeHtml(comment.author)}</div>
                    <div class="comment-text">${escapeHtml(comment.text)}</div>
                    <div class="comment-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }).join('');
}

// 加载最近浏览
function loadRecentViews() {
    const container = document.getElementById('recent-views');
    const recentViews = JSON.parse(localStorage.getItem('recent-views') || '[]');
    
    if (recentViews.length === 0) {
        container.innerHTML = `
            <div class="activity-empty">
                <div class="activity-empty-icon">👁️</div>
                <div class="activity-empty-text">暂无浏览记录</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentViews.slice(0, 8).map(view => {
        const timeAgo = getTimeAgo(view.time);
        
        return `
            <div class="view-item" onclick="loadArticle('${view.file}', '${view.title.replace(/'/g, "\\'")}')">
                <div class="view-icon">📄</div>
                <div class="view-content">
                    <div class="view-title">${escapeHtml(view.title)}</div>
                    <div class="view-meta">${timeAgo} 浏览</div>
                </div>
            </div>
        `;
    }).join('');
}

// 获取时间差文本
function getTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
}

// 渲染日历
function renderCalendar() {
    const container = document.getElementById('activity-calendar');
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                       '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // 获取有内容的日期（从文章发布日期）
    const contentDays = [];
    if (posts) {
        posts.forEach(post => {
            const postDate = new Date(post.date);
            if (postDate.getFullYear() === year && postDate.getMonth() === month) {
                contentDays.push(postDate.getDate());
            }
        });
    }
    
    let html = `
        <div class="calendar-header">
            <button class="calendar-nav prev-btn" onclick="changeCalendarMonth(-1)">‹</button>
            <span class="calendar-month">${year}年 ${monthNames[month]}</span>
            <button class="calendar-nav next-btn" onclick="changeCalendarMonth(1)">›</button>
        </div>
        <div class="calendar-grid">
    `;
    
    // 星期标题
    weekDays.forEach(day => {
        html += `<div class="calendar-weekday">${day}</div>`;
    });
    
    // 空白日期
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }
    
    // 日期
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const hasContent = contentDays.includes(day);
        
        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (hasContent) classes += ' has-content';
        
        html += `<div class="${classes}">${day}</div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// 切换月份
function changeCalendarMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}

// 加载热门标签
function loadActivityTags() {
    const container = document.getElementById('activity-tags');
    const tagCount = {};
    
    if (posts) {
        posts.forEach(post => {
            if (post.tags) {
                post.tags.forEach(tag => {
                    tagCount[tag] = (tagCount[tag] || 0) + 1;
                });
            }
        });
    }
    
    // 按数量排序并取前 30 个
    const sortedTags = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30);
    
    if (sortedTags.length === 0) {
        container.innerHTML = `
            <div class="activity-empty">
                <div class="activity-empty-icon">🏷️</div>
                <div class="activity-empty-text">暂无标签</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sortedTags.map(([tag, count]) => `
        <span class="activity-tag" onclick="filterByTag('${tag}'); toggleActivityPanel();">
            #${tag}<span class="tag-count">${count}</span>
        </span>
    `).join('');
}

// 记录浏览历史
function recordView(title, file) {
    const recentViews = JSON.parse(localStorage.getItem('recent-views') || '[]');
    
    // 移除已存在的记录
    const index = recentViews.findIndex(v => v.file === file);
    if (index !== -1) {
        recentViews.splice(index, 1);
    }
    
    // 添加到开头
    recentViews.unshift({
        title,
        file,
        time: new Date().toISOString()
    });
    
    // 限制最多保存 20 条
    if (recentViews.length > 20) {
        recentViews.splice(20);
    }
    
    localStorage.setItem('recent-views', JSON.stringify(recentViews));
}

// 导出函数
window.toggleActivityPanel = toggleActivityPanel;
window.switchActivityTab = switchActivityTab;
window.changeCalendarMonth = changeCalendarMonth;
window.recordView = recordView;
