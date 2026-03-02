const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 初始化数据库
db.initDB();

// ============ API 路由 ============

// 获取文章评论
app.get('/api/comments/:article', (req, res) => {
    const { article } = req.params;
    try {
        const comments = db.getComments(article);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 添加评论
app.post('/api/comments', (req, res) => {
    const { article, name, content } = req.body;
    if (!article || !name || !content) {
        return res.status(400).json({ error: '缺少必要参数' });
    }
    try {
        const comment = db.addComment(article, name, content);
        res.json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取文章统计数据（点赞数）
app.get('/api/stats/:article', (req, res) => {
    const { article } = req.params;
    try {
        const stat = db.getArticleStats(article);
        res.json(stat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 点赞/取消点赞文章
app.post('/api/stats/like', (req, res) => {
    const { article, action } = req.body;
    if (!article || !action) {
        return res.status(400).json({ error: '缺少必要参数' });
    }
    try {
        const stat = db.updateArticleLike(article, action);
        res.json(stat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取所有交流墙帖子
app.get('/api/wall', (req, res) => {
    try {
        const posts = db.getWallPosts();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 发布交流墙帖子
app.post('/api/wall', (req, res) => {
    const { nickname, userCode, userId, category, anonymous, content, images } = req.body;
    if (!content || !userCode) {
        return res.status(400).json({ error: '缺少必要参数' });
    }
    try {
        const post = db.addWallPost({
            nickname,
            userCode,
            userId,
            category: category || 'general',
            anonymous: anonymous ? 1 : 0,
            content,
            images: images || []
        });
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 点赞交流墙帖子
app.post('/api/wall/like', (req, res) => {
    const { id, action } = req.body;
    if (!id || !action) {
        return res.status(400).json({ error: '缺少必要参数' });
    }
    try {
        const result = db.updateWallLike(id, action);
        if (!result) {
            return res.status(404).json({ error: '帖子不存在' });
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 添加回复
app.post('/api/wall/reply', (req, res) => {
    const { postId, name, content } = req.body;
    if (!postId || !content) {
        return res.status(400).json({ error: '缺少必要参数' });
    }
    try {
        const result = db.addReply(postId, name, content);
        if (!result) {
            return res.status(404).json({ error: '帖子不存在' });
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ 静态文件服务（可选） ============
app.use(express.static(path.join(__dirname, '..')));

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📝 API 端点:`);
    console.log(`   GET  /api/comments/:article  - 获取评论`);
    console.log(`   POST /api/comments           - 添加评论`);
    console.log(`   GET  /api/stats/:article     - 获取文章统计`);
    console.log(`   POST /api/stats/like         - 点赞文章`);
    console.log(`   GET  /api/wall               - 获取交流墙`);
    console.log(`   POST /api/wall               - 发布帖子`);
    console.log(`   POST /api/wall/like          - 点赞帖子`);
    console.log(`   POST /api/wall/reply         - 回复帖子`);
});
