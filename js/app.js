// 博客应用主逻辑
let currentView = 'home';
let currentArticle = '';
let posts = [];
let currentFilter = 'all';
let currentSort = 'newest';

// API 配置 - 部署时修改为你的后端地址
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://your-backend-url.com/api';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadPosts();
    setupNavigation();
    loadWallPosts();
    setupWallForm();
    setupCommentForm();
    setupScrollProgress();
    setupSearch();
    loadFontSize();
    setupMobileMenu();
    setupNavScroll();
});

// 加载设置
function loadSettings() {
    const title = localStorage.getItem('blogTitle') || '七平方の Blog';
    const subtitle = localStorage.getItem('blogSubtitle') || '探索技术 · 分享生活 · 记录思考';
    
    document.getElementById('blog-title').textContent = title;
    document.getElementById('hero-title').textContent = title;
    document.getElementById('hero-subtitle').textContent = subtitle;
    document.title = title;
}

// 页面导航
function navigateTo(page) {
    const views = document.querySelectorAll('.view');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    const activeView = document.querySelector('.view.active');
    if (activeView) {
        activeView.classList.add('slide-out');
        setTimeout(() => {
            activeView.classList.remove('active', 'slide-out');
        }, 500);
    }
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    setTimeout(() => {
        if (page === 'home') {
            document.getElementById('home-view').classList.add('active');
        } else if (page === 'article') {
            document.getElementById('article-view').classList.add('active');
        } else if (page === 'about') {
            document.getElementById('about-view').classList.add('active');
        } else if (page === 'wall') {
            document.getElementById('wall-view').classList.add('active');
        } else if (page === 'archive') {
            document.getElementById('archive-view').classList.add('active');
            renderArchive();
        }
        currentView = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
}

// 加载文章列表
async function loadPosts() {
    try {
        const response = await fetch('posts/posts.json');
        posts = await response.json();
        renderPosts(posts);
        renderHotPosts();
        renderTagCloud();
    } catch (error) {
        console.error('加载文章失败:', error);
        document.getElementById('posts-container').innerHTML = `
            <div style="padding: 2rem; border-radius: 20px; grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.7);">
                暂无文章，请在 posts 文件夹添加文章
            </div>
        `;
    }
}

// 渲染文章卡片
function renderPosts(postsToRender) {
    const container = document.getElementById('posts-container');
    container.innerHTML = postsToRender.map((post, index) => {
        const readTime = post.readTime || Math.max(1, Math.ceil((post.excerpt?.length || 100) / 300));
        const wordCount = post.wordCount || (post.excerpt?.length || 100);
        return `
        <div class="post-card" onclick="loadArticle('${post.file}', '${post.title.replace(/'/g, "\\'")}')">
            <h2>${post.title}</h2>
            <div class="post-stats">
                <span class="stat-item">📊 ${wordCount} 字</span>
                <span class="stat-item">⏱️ ${readTime} 分钟</span>
            </div>
            <p>${post.excerpt}</p>
            <div class="post-meta">
                <span class="post-date">📅 ${post.date}</span>
                ${post.tags ? post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('') : ''}
            </div>
        </div>
    `}).join('');
}

// 渲染热门文章
function renderHotPosts() {
    const hotPostsContainer = document.getElementById('hot-posts');
    const hotPosts = posts.slice(0, 5);
    
    hotPostsContainer.innerHTML = hotPosts.map((post, index) => `
        <div class="hot-post-item" onclick="loadArticle('${post.file}', '${post.title.replace(/'/g, "\\'")}')">
            <h4>${index + 1}. ${post.title}</h4>
            <div class="hot-post-meta">📅 ${post.date}</div>
        </div>
    `).join('');
}

// 渲染标签云
function renderTagCloud() {
    const tagCloudContainer = document.getElementById('tag-cloud');
    const tagCount = {};
    
    posts.forEach(post => {
        if (post.tags) {
            post.tags.forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        }
    });
    
    const sortedTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 15);
    
    tagCloudContainer.innerHTML = sortedTags.map(([tag, count]) => `
        <span class="tag-cloud-item" onclick="filterByTag('${tag}')">${tag} (${count})</span>
    `).join('');
}

// 按标签筛选
function filterByTag(tag) {
    const filtered = posts.filter(post => 
        post.tags && post.tags.includes(tag)
    );
    renderPosts(filtered);
    showToast(`筛选标签：${tag}`);
}

// 加载单篇文章
async function loadArticle(filename, title) {
    try {
        const response = await fetch(`posts/${filename}`);
        const markdown = await response.text();
        const html = marked.parse(markdown);

        document.getElementById('article-content').innerHTML = `<h1>${title}</h1>` + html;
        currentArticle = filename;

        generateTOC();
        loadComments();
        loadArticleStats();
        renderRelatedPosts();
        
        // 记录浏览历史
        if (typeof recordView === 'function') {
            recordView(title, filename);
        }

        navigateTo('article');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('加载文章失败:', error);
        showToast('文章加载失败，请稍后重试');
    }
}

// 生成目录
function generateTOC() {
    const article = document.getElementById('article-content');
    const headings = article.querySelectorAll('h2, h3');
    const tocList = document.getElementById('toc-list');
    
    if (headings.length === 0) {
        document.querySelector('.toc-container').style.display = 'none';
        return;
    }
    
    document.querySelector('.toc-container').style.display = 'block';
    tocList.innerHTML = '';
    
    headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        const level = heading.tagName === 'H2' ? 'toc-h2' : 'toc-h3';
        const li = document.createElement('li');
        li.innerHTML = `<a href="#${id}" class="${level}" onclick="scrollToHeading(event, '${id}')">${heading.textContent}</a>`;
        tocList.appendChild(li);
    });
}

// 滚动到标题
function scrollToHeading(event, id) {
    event.preventDefault();
    const element = document.getElementById(id);
    if (element) {
        const offset = 120;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
}

// 设置滚动进度条
function setupScrollProgress() {
    window.addEventListener('scroll', () => {
        const articleView = document.getElementById('article-view');
        if (!articleView.classList.contains('active')) return;

        const progressBar = document.getElementById('progress-bar');
        const article = document.getElementById('article-content');
        if (!article) return;

        const articleTop = article.offsetTop;
        const articleHeight = article.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollPosition = window.scrollY;

        const progress = Math.min(100, Math.max(0,
            ((scrollPosition - articleTop + windowHeight) / articleHeight) * 100
        ));

        progressBar.style.width = `${progress}%`;
        
        // 更新进度条文本
        const progressText = document.getElementById('progress-text');
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
        
        // 高亮当前章节
        highlightActiveHeading();
    });
}

// 高亮当前阅读的章节
function highlightActiveHeading() {
    const article = document.getElementById('article-content');
    if (!article) return;
    
    const headings = article.querySelectorAll('h2, h3');
    if (headings.length === 0) return;
    
    const scrollPosition = window.scrollY + 150;
    
    let activeHeading = null;
    headings.forEach(heading => {
        const headingTop = heading.offsetTop;
        if (headingTop <= scrollPosition) {
            activeHeading = heading;
        }
    });
    
    if (activeHeading) {
        const index = Array.from(headings).indexOf(activeHeading);
        document.querySelectorAll('.toc-list a').forEach((link, i) => {
            link.classList.remove('active');
            if (i === index) {
                link.classList.add('active');
            }
        });
    }
}

// 加载文章统计（点赞等）
async function loadArticleStats() {
    try {
        const response = await fetch(`${API_BASE}/stats/${encodeURIComponent(currentArticle)}`);
        const stats = await response.json();
        document.getElementById('like-count').textContent = stats.likes || 0;
    } catch (error) {
        console.error('加载统计失败:', error);
        // 降级：使用 localStorage
        loadArticleStatsLocal();
    }
}

function loadArticleStatsLocal() {
    const stats = JSON.parse(localStorage.getItem(`article-${currentArticle}`) || '{}');
    document.getElementById('like-count').textContent = stats.likes || 0;
    const liked = localStorage.getItem(`liked-${currentArticle}`) === 'true';
    updateLikeButton(liked);
}

function updateLikeButton(liked) {
    const likeBtn = document.getElementById('like-btn');
    if (liked) {
        likeBtn.classList.add('liked');
    } else {
        likeBtn.classList.remove('liked');
    }
}

// 点赞文章
async function likeArticle() {
    const hasLiked = localStorage.getItem(`liked-${currentArticle}`) === 'true';
    const action = hasLiked ? 'remove' : 'add';

    try {
        const response = await fetch(`${API_BASE}/stats/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ article: currentArticle, action })
        });
        
        if (response.ok) {
            const result = await response.json();
            document.getElementById('like-count').textContent = result.likes || 0;
            localStorage.setItem(`liked-${currentArticle}`, action === 'add' ? 'true' : 'false');
            updateLikeButton(action === 'add');
        } else {
            throw new Error('点赞失败');
        }
    } catch (error) {
        console.error('点赞失败:', error);
        // 降级：使用 localStorage
        likeArticleLocal();
    }
}

function likeArticleLocal() {
    const stats = JSON.parse(localStorage.getItem(`article-${currentArticle}`) || '{}');
    const hasLiked = localStorage.getItem(`liked-${currentArticle}`) === 'true';

    if (hasLiked) {
        stats.likes = Math.max(0, (stats.likes || 1) - 1);
        localStorage.removeItem(`liked-${currentArticle}`);
        document.getElementById('like-btn').classList.remove('liked');
    } else {
        stats.likes = (stats.likes || 0) + 1;
        localStorage.setItem(`liked-${currentArticle}`, 'true');
        document.getElementById('like-btn').classList.add('liked');
    }

    localStorage.setItem(`article-${currentArticle}`, JSON.stringify(stats));
    document.getElementById('like-count').textContent = stats.likes || 0;
}

// 收藏文章
function bookmarkArticle() {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const index = bookmarks.findIndex(b => b.file === currentArticle);
    
    if (index !== -1) {
        bookmarks.splice(index, 1);
        showToast('已取消收藏');
    } else {
        const post = posts.find(p => p.file === currentArticle);
        if (post) {
            bookmarks.push({ file: currentArticle, title: post.title, date: new Date().toLocaleString() });
            showToast('已加入收藏');
        }
    }
    
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

// 分享文章
function shareArticle(platform) {
    const post = posts.find(p => p.file === currentArticle);
    if (!post) return;
    
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);
    
    const shareUrls = {
        wechat: `weixin://`,
        weibo: `https://service.weibo.com/share/share.php?url=${url}&title=${title}`,
        qq: `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${url}&title=${title}`
    };
    
    if (platform === 'wechat') {
        showToast('请复制链接到微信分享');
    } else {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
}

// 复制链接
function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('链接已复制');
    }).catch(() => {
        showToast('复制失败，请手动复制');
    });
}

// 渲染相关文章
function renderRelatedPosts() {
    const currentPost = posts.find(p => p.file === currentArticle);
    if (!currentPost || !currentPost.tags) {
        document.getElementById('related-posts').innerHTML = '';
        return;
    }
    
    const related = posts
        .filter(p => p.file !== currentArticle && p.tags && 
            p.tags.some(t => currentPost.tags.includes(t)))
        .slice(0, 3);
    
    const container = document.getElementById('related-posts');
    container.innerHTML = related.map(post => `
        <div class="related-post-card" onclick="loadArticle('${post.file}', '${post.title.replace(/'/g, "\\'")}')">
            <h4>${post.title}</h4>
            <div class="related-post-meta">📅 ${post.date}</div>
        </div>
    `).join('');
    
    if (related.length === 0) {
        container.innerHTML = '<p style="color: rgba(255,255,255,0.5);">暂无相关文章</p>';
    }
}

// 加载评论
async function loadComments() {
    try {
        const response = await fetch(`${API_BASE}/comments/${encodeURIComponent(currentArticle)}`);
        const comments = await response.json();
        const container = document.getElementById('comments-list');
        document.getElementById('comment-count').textContent = `(${comments.length})`;

        if (comments.length === 0) {
            container.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 2rem;">暂无评论，快来抢沙发吧～</p>';
            return;
        }

        container.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">👤 ${escapeHtml(comment.name)}</span>
                    <span class="comment-date">${comment.date}</span>
                </div>
                <div class="comment-content">${escapeHtml(comment.content)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载评论失败:', error);
        // 降级：如果 API 失败，尝试从 localStorage 读取
        const comments = JSON.parse(localStorage.getItem(`comments-${currentArticle}`) || '[]');
        if (comments.length > 0) {
            renderCommentsFromLocal(comments);
        }
    }
}

function renderCommentsFromLocal(comments) {
    const container = document.getElementById('comments-list');
    document.getElementById('comment-count').textContent = `(${comments.length})`;
    container.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">👤 ${escapeHtml(comment.name)}</span>
                <span class="comment-date">${comment.date}</span>
            </div>
            <div class="comment-content">${escapeHtml(comment.content)}</div>
        </div>
    `).join('');
}

// 设置评论表单
function setupCommentForm() {
    const form = document.getElementById('comment-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('comment-name').value.trim();
        const content = document.getElementById('comment-content').value.trim();

        if (!name || !content) {
            showToast('请填写昵称和评论内容');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ article: currentArticle, name, content })
            });
            
            if (response.ok) {
                document.getElementById('comment-name').value = '';
                document.getElementById('comment-content').value = '';
                loadComments();
                showToast('评论成功');
            } else {
                throw new Error('评论失败');
            }
        } catch (error) {
            console.error('评论失败:', error);
            // 降级：保存到 localStorage
            const comments = JSON.parse(localStorage.getItem(`comments-${currentArticle}`) || '[]');
            comments.push({ name, content, date: new Date().toLocaleString('zh-CN') });
            localStorage.setItem(`comments-${currentArticle}`, JSON.stringify(comments));
            document.getElementById('comment-name').value = '';
            document.getElementById('comment-content').value = '';
            loadComments();
            showToast('评论成功 (本地存储)');
        }
    });
}

// 渲染归档
function renderArchive() {
    const archiveList = document.getElementById('archive-list');
    const timelineList = document.getElementById('timeline-list');
    const postsByMonth = {};

    posts.forEach(post => {
        const month = post.date.substring(0, 7);
        if (!postsByMonth[month]) {
            postsByMonth[month] = [];
        }
        postsByMonth[month].push(post);
    });

    const sortedMonths = Object.keys(postsByMonth).sort((a, b) => b.localeCompare(a));

    // 列表视图
    archiveList.innerHTML = sortedMonths.map(month => {
        const monthPosts = postsByMonth[month];
        return `
            <div class="archive-month">
                <h3>${month}</h3>
                <div class="archive-posts">
                    ${monthPosts.map(post => `
                        <div class="archive-post-item" onclick="loadArticle('${post.file}', '${post.title.replace(/'/g, "\\'")}')">
                            <span class="archive-post-title">${post.title}</span>
                            <span class="archive-post-meta">📊 ${post.wordCount || post.excerpt?.length || 100} 字 · ⏱️ ${post.readTime || Math.max(1, Math.ceil((post.excerpt?.length || 100) / 300))} 分钟</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    // 年表视图
    const postsByYear = {};
    posts.forEach(post => {
        const year = post.date.substring(0, 4);
        if (!postsByYear[year]) {
            postsByYear[year] = [];
        }
        postsByYear[year].push(post);
    });
    
    const sortedYears = Object.keys(postsByYear).sort((a, b) => b.localeCompare(a));
    
    timelineList.innerHTML = sortedYears.map(year => {
        const yearPosts = postsByYear[year];
        return `
            <div class="timeline-year">
                <div class="timeline-year-header">
                    <h2>${year} 年</h2>
                    <span class="timeline-year-count">共 ${yearPosts.length} 篇文章</span>
                </div>
                <div class="timeline-items">
                    ${yearPosts.map((post, index) => `
                        <div class="timeline-item" onclick="loadArticle('${post.file}', '${post.title.replace(/'/g, "\\'")}')">
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <div class="timeline-date">${post.date}</div>
                                <h3 class="timeline-title">${post.title}</h3>
                                <p class="timeline-excerpt">${post.excerpt}</p>
                                <div class="timeline-tags">
                                    ${post.tags ? post.tags.map(tag => `<span class="timeline-tag">#${tag}</span>`).join('') : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// 切换归档视图
function switchArchiveView(view) {
    const archiveList = document.getElementById('archive-list');
    const timelineList = document.getElementById('timeline-list');
    const tabs = document.querySelectorAll('.archive-tab');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.view === view) {
            tab.classList.add('active');
        }
    });
    
    if (view === 'list') {
        archiveList.style.display = 'block';
        timelineList.style.display = 'none';
    } else {
        archiveList.style.display = 'none';
        timelineList.style.display = 'block';
    }
}

// 设置导航
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
        });
    });
}

// 搜索功能
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const results = document.getElementById('search-results');
        
        if (query.length < 1) {
            results.innerHTML = '';
            return;
        }
        
        const filtered = posts.filter(post => 
            post.title.toLowerCase().includes(query) || 
            post.excerpt.toLowerCase().includes(query) ||
            (post.tags && post.tags.some(t => t.toLowerCase().includes(query)))
        ).slice(0, 10);
        
        results.innerHTML = filtered.map(post => `
            <div class="search-result-item" onclick="loadArticle('${post.file}', '${post.title.replace(/'/g, "\\'")}'); toggleSearch();">
                <h4>${post.title}</h4>
                <p>${post.excerpt}</p>
            </div>
        `).join('');
        
        if (filtered.length === 0) {
            results.innerHTML = '<p style="padding: 1rem; text-align: center; color: rgba(255,255,255,0.5);">未找到相关文章</p>';
        }
    });
}

function toggleSearch() {
    const overlay = document.getElementById('search-overlay');
    overlay.classList.toggle('show');
    if (overlay.classList.contains('show')) {
        document.getElementById('search-input').focus();
    }
}

function handleSearch(event) {
    if (event.key === 'Escape') {
        toggleSearch();
    }
}

// 字体大小调节
function toggleFontSize() {
    const sizes = ['0.9rem', '1rem', '1.1rem', '1.2rem'];
    const current = localStorage.getItem('fontSize') || '1rem';
    const currentIndex = sizes.indexOf(current);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];
    
    document.documentElement.style.setProperty('--article-font-size', nextSize);
    localStorage.setItem('fontSize', nextSize);
    document.getElementById('font-btn').textContent = nextSize;
}

function loadFontSize() {
    const size = localStorage.getItem('fontSize') || '1rem';
    document.documentElement.style.setProperty('--article-font-size', size);
    document.getElementById('font-btn').textContent = size;
}

// 交流墙功能
async function loadWallPosts() {
    try {
        const response = await fetch(`${API_BASE}/wall`);
        const posts = await response.json();
        renderWallPosts(posts);
    } catch (error) {
        console.error('加载交流墙失败:', error);
        // 降级：使用 localStorage
        loadWallPostsLocal();
    }
}

function loadWallPostsLocal() {
    const allPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    const pendingPosts = JSON.parse(localStorage.getItem('wall-posts-pending') || '[]');
    
    // 为没有 ID 的帖子生成 ID
    [...allPosts, ...pendingPosts].forEach((post, index) => {
        if (!post.id) {
            post.id = 'post_' + index + '_' + Date.now().toString(36);
        }
    });
    
    localStorage.setItem('wall-posts', JSON.stringify(allPosts));
    
    const posts = [...allPosts, ...pendingPosts];
    renderWallPosts(posts);
}

function renderWallPosts(posts) {
    const container = document.getElementById('wall-posts-container');

    let filtered = posts;
    if (currentFilter !== 'all') {
        filtered = posts.filter(p => p.category === currentFilter);
    }

    // 置顶帖子优先
    const pinned = filtered.filter(p => p.pinned);
    const normal = filtered.filter(p => !p.pinned);
    
    if (currentSort === 'hotest') {
        normal.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
        normal.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    filtered = [...pinned, ...normal];

    if (filtered.length === 0) {
        container.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 3rem; font-size: 1.1rem;">暂无帖子，快来发表第一个帖子吧！</p>';
        return;
    }

    container.innerHTML = filtered.map((post, index) => {
        const userLevel = getUserLevel(post.userId);
        const signature = getUserSignature(post.userId);
        const isBookmarked = (JSON.parse(localStorage.getItem('wall-bookmarks') || '[]').includes(post.id));
        const userCode = localStorage.getItem('wall-userCode');
        const isAuthor = post.userCode === userCode || userCode === 'admin';
        
        return `
        <div class="wall-post ${post.pinned ? 'pinned' : ''}" data-id="${post.id}" style="animation-delay: ${index * 0.1}s">
            <div class="wall-post-header">
                <div class="wall-post-author">
                    ${generateAvatar(post.userId, post.nickname, post.anonymous)}
                    <div class="author-info">
                        <div class="author-name-row">
                            <span class="author-name">${post.anonymous ? '匿名用户' : (post.nickname || '匿名')}</span>
                            ${generateLevelBadge(post.userId)}
                            ${post.pinned ? '<span class="pin-badge">📌 置顶</span>' : ''}
                        </div>
                        <span class="author-id">ID: ${post.userId}</span>
                        ${signature ? `<span class="user-signature">${signature}</span>` : ''}
                    </div>
                </div>
                <span class="wall-post-category">${getCategoryName(post.category)}</span>
                <span class="wall-post-date">${post.date} ${post.edited ? '<span class="edited-tag">(已编辑)</span>' : ''}</span>
            </div>
            <div class="wall-post-content">${escapeHtml(post.content)}</div>
            ${post.images && post.images.length > 0 ? `
                <div class="wall-post-images">
                    ${post.images.map((img, imgIndex) => `<img src="${img}" class="wall-post-image" onclick="viewImageEnhanced(${JSON.stringify(post.images)}, ${imgIndex})" alt="">`).join('')}
                </div>
            ` : ''}
            <div class="wall-post-actions">
                <button class="wall-action-btn like-btn ${post.liked ? 'liked' : ''}" onclick="likeWallPostEnhanced('${post.id}', '${post.userId}')">
                    ❤️ <span>${post.likes || 0}</span>
                </button>
                <button class="wall-action-btn" onclick="toggleReply('${post.userId}-${post.date}')">
                    💬 回复
                </button>
                <button class="wall-action-btn bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="bookmarkWallPost('${post.id}')">
                    🔖 收藏
                </button>
                ${isAuthor ? `
                    <button class="wall-action-btn edit-btn" onclick="editWallPost('${post.id}')">
                        ✏️ 编辑
                    </button>
                    <button class="wall-action-btn delete-btn" onclick="deleteWallPost('${post.id}')">
                        🗑️ 删除
                    </button>
                ` : ''}
                <button class="wall-action-btn report-btn" onclick="reportWallPost('${post.id}')">
                    🚩 举报
                </button>
            </div>
            <div class="reply-section" id="reply-${post.userId}-${post.date}" style="display: none;">
                <div class="reply-form">
                    <input type="text" id="reply-input-${post.userId}-${post.date}" placeholder="写下你的回复...">
                    <button onclick="submitReply('${post.userId}', '${post.date}')">发送</button>
                </div>
                <div class="replies-list" id="replies-${post.userId}-${post.date}">
                    ${(post.replies || []).map((reply, replyIndex) => `
                        <div class="reply-item">
                            <span class="reply-floor">${replyIndex + 1}楼</span>
                            <strong>${escapeHtml(reply.name)}:</strong> ${escapeHtml(reply.content)}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `}).join('');
    
    // 初始化表情选择器
    renderEmojiPicker();
}

function getCategoryName(cat) {
    const names = {
        'general': '💬 综合',
        'question': '❓ 提问',
        'share': '📢 分享',
        'help': '🆘 求助',
        'other': '🔖 其他'
    };
    return names[cat] || '💬 综合';
}

function setupWallForm() {
    const form = document.getElementById('wall-post-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nickname = document.getElementById('wall-nickname').value.trim();
        const code = document.getElementById('wall-code').value.trim();
        const content = document.getElementById('wall-content').value.trim();
        const category = document.getElementById('wall-category').value;
        const anonymous = document.getElementById('wall-anonymous').checked;

        if (code.length < 4) {
            showToast('校验码至少 4 位');
            return;
        }

        if (!content) {
            showToast('请输入内容');
            return;
        }

        // 保存用户代码到 localStorage（用于编辑/删除验证）
        localStorage.setItem('wall-userCode', code);

        // 生成/获取 userId
        let userId = localStorage.getItem('wall-userId-' + code);
        let finalNickname = anonymous ? '匿名' : (nickname || '匿名');

        if (!userId) {
            userId = 'U' + Date.now().toString(36).toUpperCase();
            localStorage.setItem('wall-userId-' + code, userId);
        }

        try {
            const response = await fetch(`${API_BASE}/wall`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: finalNickname,
                    userCode: code,
                    userId,
                    category,
                    anonymous,
                    content,
                    images: []
                })
            });
            
            if (response.ok) {
                document.getElementById('wall-nickname').value = '';
                document.getElementById('wall-code').value = '';
                document.getElementById('wall-content').value = '';
                document.getElementById('wall-anonymous').checked = false;
                document.getElementById('image-preview').innerHTML = '';
                loadWallPosts();
                showToast('发帖成功！');
            } else {
                throw new Error('发帖失败');
            }
        } catch (error) {
            console.error('发帖失败:', error);
            // 降级：保存到 localStorage
            saveWallPostLocal(nickname, code, userId, category, anonymous, content);
        }
    });

    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadWallPosts();
        });
    });
}

function saveWallPostLocal(nickname, code, userId, category, anonymous, content) {
    const allPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    const newPost = {
        nickname: anonymous ? '匿名' : nickname,
        userCode: code,
        userId,
        category,
        anonymous,
        content,
        images: [],
        likes: 0,
        replies: [],
        date: new Date().toLocaleString('zh-CN')
    };
    allPosts.unshift(newPost);
    localStorage.setItem('wall-posts', JSON.stringify(allPosts));
    loadWallPosts();
    showToast('发帖成功 (本地存储)');
}

function sortWallPosts() {
    currentSort = document.getElementById('wall-sort').value;
    loadWallPosts();
}

async function likeWallPost(index, userId, date) {
    // 从 DOM 获取帖子 ID
    const postElement = document.querySelector(`.wall-post:has(.author-info:has(.author-id:contains("${userId}")))`);
    const postId = postElement?.dataset?.id;
    
    if (!postId) {
        likeWallPostLocal(userId, date);
        return;
    }

    const hasLiked = localStorage.getItem(`liked-wall-${postId}`) === 'true';
    const action = hasLiked ? 'remove' : 'add';

    try {
        const response = await fetch(`${API_BASE}/wall/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: postId, action })
        });
        
        if (response.ok) {
            const result = await response.json();
            localStorage.setItem(`liked-wall-${postId}`, action === 'add' ? 'true' : 'false');
            loadWallPosts();
        } else {
            throw new Error('点赞失败');
        }
    } catch (error) {
        console.error('点赞失败:', error);
        likeWallPostLocal(userId, date);
    }
}

function likeWallPostLocal(userId, date) {
    const allPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    const post = allPosts.find(p => p.userId === userId && p.date === date);
    if (post) {
        const hasLiked = localStorage.getItem(`liked-wall-${userId}-${date}`) === 'true';
        if (hasLiked) {
            post.likes = Math.max(0, post.likes - 1);
            localStorage.removeItem(`liked-wall-${userId}-${date}`);
        } else {
            post.likes = (post.likes || 0) + 1;
            localStorage.setItem(`liked-wall-${userId}-${date}`, 'true');
        }
        localStorage.setItem('wall-posts', JSON.stringify(allPosts));
        loadWallPosts();
    }
}

function toggleReply(id) {
    const section = document.getElementById(`reply-${id}`);
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

async function submitReply(userId, date) {
    const input = document.getElementById(`reply-input-${userId}-${date}`);
    const content = input.value.trim();

    if (!content) {
        showToast('请输入回复内容');
        return;
    }

    // 尝试从 DOM 获取帖子 ID
    const replySection = document.getElementById(`reply-${userId}-${date}`);
    const postElement = replySection?.closest('.wall-post');
    const postId = postElement?.dataset?.id;

    if (postId) {
        try {
            const response = await fetch(`${API_BASE}/wall/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId, name: '访客', content })
            });
            
            if (response.ok) {
                input.value = '';
                loadWallPosts();
                showToast('回复成功');
            } else {
                throw new Error('回复失败');
            }
        } catch (error) {
            console.error('回复失败:', error);
            submitReplyLocal(userId, date, content);
        }
    } else {
        submitReplyLocal(userId, date, content);
    }
}

function submitReplyLocal(userId, date, content) {
    const allPosts = JSON.parse(localStorage.getItem('wall-posts') || '[]');
    const post = allPosts.find(p => p.userId === userId && p.date === date);

    if (post) {
        if (!post.replies) post.replies = [];
        post.replies.push({
            name: '访客',
            content,
            date: new Date().toLocaleString()
        });
        localStorage.setItem('wall-posts', JSON.stringify(allPosts));
        loadWallPosts();
        showToast('回复成功 (本地存储)');
    }
}

function reportPost(userId, date) {
    showToast('已举报，感谢反馈');
}

function previewImages() {
    const input = document.getElementById('wall-image');
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
    
    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-image';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

function viewImage(src) {
    document.getElementById('image-viewer-img').src = src;
    document.getElementById('image-modal').classList.add('show');
}

function closeImageModal() {
    document.getElementById('image-modal').classList.remove('show');
}

// 工具函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// 移动端菜单
function toggleMobileMenu() {
    const overlay = document.getElementById('mobile-menu-overlay');
    const menu = document.getElementById('mobile-menu');
    overlay.classList.toggle('show');
    menu.classList.toggle('show');
}

function setupMobileMenu() {
    // 移动端菜单已经通过 onclick 直接调用 toggleMobileMenu
}

// 导航栏滚动效果
function setupNavScroll() {
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.glass-nav');
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

// 全局函数
window.navigateTo = navigateTo;
window.loadArticle = loadArticle;
window.scrollToHeading = scrollToHeading;
window.likeArticle = likeArticle;
window.bookmarkArticle = bookmarkArticle;
window.shareArticle = shareArticle;
window.copyLink = copyLink;
window.toggleSearch = toggleSearch;
window.handleSearch = handleSearch;
window.toggleFontSize = toggleFontSize;
window.filterByTag = filterByTag;
window.likeWallPost = likeWallPost;
window.submitReply = submitReply;
window.reportPost = reportPost;
window.previewImages = previewImages;
window.viewImage = viewImage;
window.closeImageModal = closeImageModal;
window.sortWallPosts = sortWallPosts;
window.toggleMobileMenu = toggleMobileMenu;
window.switchArchiveView = switchArchiveView;
