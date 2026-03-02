# 七平方の Blog - 全栈部署指南

## 架构说明

- **前端**: 静态 HTML/CSS/JS (Vercel 部署)
- **后端**: Node.js + Express + SQLite (Railway 部署)
- **数据**: 评论、点赞、交流墙数据通过后端 API 存储，实现多设备互通

---

## 📦 第一步：部署后端 (Railway)

### 1. 访问 Railway
前往 https://railway.app 并注册账号 (支持 GitHub 登录)

### 2. 创建新项目
1. 点击 **New Project**
2. 选择 **Deploy from GitHub repo**
3. 连接你的博客仓库

### 3. 配置后端服务
1. 在项目中点击 **New** → **Empty Service**
2. 设置 **Root Directory** 为 `server`
3. 添加 **Start Command**: `node server.js`

### 4. 添加环境变量
在 Railway 面板中添加：
```
PORT=3000
NODE_ENV=production
```

### 5. 等待部署
Railway 会自动安装依赖并启动服务，部署成功后会显示：
```
https://your-app-production.up.railway.app
```

### 6. 记录后端地址
复制 Railway 提供的 URL，例如：
`https://qipingfang-blog-server-production.up.railway.app`

---

## 🎨 第二步：部署前端 (Vercel)

### 1. 修改 API 配置
编辑 `js/app.js`，将 API_BASE 改为你的后端地址：

```javascript
const API_BASE = 'https://your-backend-url.com/api';
```

替换 `your-backend-url.com` 为 Railway 提供的 URL

### 2. 推送到 GitHub
```bash
git add .
git commit -m "Update API base URL for production"
git push
```

### 3. 在 Vercel 部署
1. 访问 https://vercel.com/new
2. 导入你的 GitHub 仓库
3. 保持默认设置，点击 **Deploy**

### 4. 获取前端地址
部署成功后，Vercel 会提供：
```
https://qipingfang-blog.vercel.app
```

---

## 🧪 第三步：测试功能

访问你的博客，测试以下功能：

### 评论功能
1. 打开任意文章
2. 发表一条评论
3. 刷新页面，评论应该还在
4. 用手机访问同一篇文章，应该能看到评论

### 点赞功能
1. 点击文章点赞按钮
2. 刷新页面，点赞数应该保留
3. 用手机访问，应该能看到点赞数

### 交流墙
1. 发布一个帖子
2. 刷新页面，帖子应该还在
3. 用手机访问，应该能看到帖子
4. 尝试点赞和回复

---

## 🔧 本地开发

### 启动后端
```bash
cd server
npm install
npm start
```
后端运行在 `http://localhost:3000`

### 启动前端
直接打开 `index.html` 或使用：
```bash
npx serve .
```

本地开发时，前端会自动使用 `http://localhost:3000/api`

---

## 📊 数据库管理

### 查看数据
数据库文件位于 `server/blog.db`

使用 SQLite 工具查看：
```bash
# 安装 SQLite CLI
sqlite3 server/blog.db

# 查看评论
SELECT * FROM comments;

# 查看交流墙
SELECT * FROM wall_posts;

# 查看文章统计
SELECT * FROM article_stats;
```

### 备份数据
定期备份 `server/blog.db` 文件，或导出 SQL：
```bash
sqlite3 server/blog.db .dump > backup.sql
```

---

## 🚨 常见问题

### Q: Railway 部署失败？
A: 检查 `server/package.json` 是否存在，确保 `server.js` 路径正确

### Q: 前端无法连接后端？
A: 检查 `js/app.js` 中的 `API_BASE` 是否配置正确

### Q: CORS 错误？
A: 后端已配置 CORS，如仍有问题检查 Railway 日志

### Q: 数据不互通？
A: 确保所有设备访问的是同一个 Vercel 域名

---

## 🎯 替代部署方案

### 方案 A: Vercel Serverless Functions
将后端代码改为 Vercel Serverless Functions 格式，前端和后端都在 Vercel 部署

### 方案 B: Render.com
使用 Render 部署后端，类似 Railway 操作

### 方案 C: Heroku
传统方案，需要绑定信用卡

### 方案 D: 自建服务器
使用 VPS 自行部署，完全控制

---

## 📝 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| PORT | 后端服务端口 | 3000 |
| NODE_ENV | 运行环境 | production |

---

## ✅ 完成检查清单

- [ ] 后端在 Railway 部署成功
- [ ] 前端 API_BASE 已更新
- [ ] 前端在 Vercel 部署成功
- [ ] 评论功能测试通过
- [ ] 点赞功能测试通过
- [ ] 交流墙功能测试通过
- [ ] 多设备数据互通测试通过

---

## 🎉 恭喜！

你的博客现在支持：
- ✅ 评论数据云端存储
- ✅ 点赞数全局同步
- ✅ 交流墙帖子永久保存
- ✅ 多设备数据互通

享受你的全栈博客吧！
