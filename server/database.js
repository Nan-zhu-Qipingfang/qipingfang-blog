const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');
const LOCK_PATH = path.join(__dirname, 'db.lock');

// 初始化数据库文件
function initDB() {
    if (!fs.existsSync(DB_PATH)) {
        const initialData = {
            comments: [],
            article_stats: [],
            wall_posts: []
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
        console.log('✅ 数据库初始化完成');
    }
    
    // 清理可能的锁文件
    if (fs.existsSync(LOCK_PATH)) {
        try {
            fs.unlinkSync(LOCK_PATH);
        } catch (e) {}
    }
}

// 读取数据（带文件锁）
function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取数据库失败:', error);
        return { comments: [], article_stats: [], wall_posts: [] };
    }
}

// 写入数据（带文件锁）
function writeDB(data) {
    fs.writeFileSync(LOCK_PATH, 'locked');
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } finally {
        if (fs.existsSync(LOCK_PATH)) {
            fs.unlinkSync(LOCK_PATH);
        }
    }
}

// 获取评论
function getComments(article) {
    const db = readDB();
    return db.comments.filter(c => c.article === article).sort((a, b) => new Date(b.date) - new Date(a.date));
}

// 添加评论
function addComment(article, name, content) {
    const db = readDB();
    const comment = {
        id: Date.now().toString(),
        article,
        name,
        content,
        date: new Date().toLocaleString('zh-CN')
    };
    db.comments.push(comment);
    writeDB(db);
    return comment;
}

// 获取文章统计
function getArticleStats(article) {
    const db = readDB();
    return db.article_stats.find(s => s.article === article) || { article, likes: 0, views: 0 };
}

// 更新文章点赞
function updateArticleLike(article, action) {
    const db = readDB();
    let stat = db.article_stats.find(s => s.article === article);
    
    if (!stat) {
        stat = { article, likes: 0, views: 0 };
        db.article_stats.push(stat);
    }
    
    if (action === 'add') {
        stat.likes += 1;
    } else {
        stat.likes = Math.max(0, stat.likes - 1);
    }
    
    writeDB(db);
    return { article, likes: stat.likes, views: stat.views };
}

// 获取所有交流墙帖子
function getWallPosts() {
    const db = readDB();
    return db.wall_posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// 发布交流墙帖子
function addWallPost(data) {
    const db = readDB();
    const post = {
        id: Date.now().toString(),
        ...data,
        likes: 0,
        replies: [],
        date: new Date().toLocaleString('zh-CN')
    };
    db.wall_posts.unshift(post);
    writeDB(db);
    return post;
}

// 更新交流墙点赞
function updateWallLike(id, action) {
    const db = readDB();
    const post = db.wall_posts.find(p => p.id === id);
    
    if (!post) return null;
    
    if (action === 'add') {
        post.likes += 1;
    } else {
        post.likes = Math.max(0, post.likes - 1);
    }
    
    writeDB(db);
    return { id, likes: post.likes };
}

// 添加回复
function addReply(postId, name, content) {
    const db = readDB();
    const post = db.wall_posts.find(p => p.id === postId);
    
    if (!post) return null;
    
    if (!post.replies) post.replies = [];
    post.replies.push({
        name: name || '访客',
        content,
        date: new Date().toLocaleString('zh-CN')
    });
    
    writeDB(db);
    return { postId, replies: post.replies };
}

module.exports = {
    initDB,
    getComments,
    addComment,
    getArticleStats,
    updateArticleLike,
    getWallPosts,
    addWallPost,
    updateWallLike,
    addReply
};
