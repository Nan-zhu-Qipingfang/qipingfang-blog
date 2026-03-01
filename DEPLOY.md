# 七平方の Blog - Vercel 部署指南

## 方法一：使用 Vercel CLI（推荐）

### 1. 安装 Vercel CLI
```bash
npm install -g vercel
```

### 2. 登录 Vercel
```bash
vercel login
```
按提示选择登录方式（GitHub/GitLab/Bitbucket/邮箱）

### 3. 部署项目
在项目根目录执行：
```bash
vercel
```

首次部署会提示：
- **Set up and deploy?** → Yes
- **Which scope?** → 选择你的账户
- **Link to existing project?** → No
- **What's your project's name?** → 输入项目名称（如：qipingfang-blog）
- **In which directory is your code located?** → ./
- **Want to override the settings?** → No

### 4. 生产环境部署
```bash
vercel --prod
```

---

## 方法二：使用 GitHub 自动部署

### 1. 初始化 Git 仓库
```bash
cd c:\Users\Administrator\Desktop\Blog
git init
git add .
git commit -m "Initial commit - 七平方の Blog"
```

### 2. 创建 GitHub 仓库
访问 https://github.com/new
- 创建新仓库（如：qipingfang-blog）
- 不要勾选 README/.gitignore

### 3. 推送代码到 GitHub
```bash
git remote add origin https://github.com/你的用户名/qipingfang-blog.git
git branch -M main
git push -u origin main
```

### 4. 在 Vercel 连接 GitHub 仓库
1. 访问 https://vercel.com/new
2. 点击 **Continue with GitHub**
3. 点击 **Import Git Repository**
4. 选择你的仓库
5. 点击 **Deploy**

---

## 方法三：直接拖拽部署（最简单）

### 使用 Vercel Dashboard

1. 访问 https://vercel.com/dashboard
2. 点击 **Add New...** → **Project**
3. 选择 **Continue with Email** 或其他登录方式
4. 点击 **Deploy** 
5. 在本地使用 Vercel CLI：
   ```bash
   vercel --name qipingfang-blog
   ```

---

## 部署后配置

### 自定义域名（可选）
1. 在 Vercel Dashboard 进入项目
2. 点击 **Settings** → **Domains**
3. 添加你的域名
4. 按提示配置 DNS

### 环境变量（如需要）
1. 进入项目 **Settings** → **Environment Variables**
2. 添加所需环境变量

---

## 访问部署后的网站

部署完成后，Vercel 会提供：
- **开发预览 URL**: `https://qipingfang-blog-xxx.vercel.app`
- **生产 URL**: `https://qipingfang-blog.vercel.app`

---

## 更新内容

### 修改文章
编辑 `posts/` 目录下的 Markdown 文件，然后：
```bash
git add .
git commit -m "Update posts"
git push
```
Vercel 会自动重新部署。

### 添加新文章
1. 在 `posts/posts.json` 中添加文章信息
2. 创建对应的 `.md` 文件
3. 提交并推送

---

## 注意事项

1. **静态网站限制**: Vercel 静态部署不支持服务器端功能
   - 评论和交流墙数据存储在浏览器 localStorage
   - 不同设备之间数据不互通

2. **posts.json 更新**: 修改文章列表后需要重新部署

3. **免费额度**: Vercel 免费计划足够个人博客使用
   - 每月 100GB 带宽
   - 无限次部署

---

## 常见问题

**Q: 部署后看不到文章？**
A: 检查 `posts/posts.json` 路径是否正确，确保 Markdown 文件在 `posts/` 目录下。

**Q: 如何查看部署日志？**
A: 在 Vercel Dashboard 点击项目 → **Deployments** → 查看具体部署详情。

**Q: 如何回滚到之前的版本？**
A: 在 **Deployments** 页面找到之前的版本，点击 **Promote to Production**。

---

## 技术支持

- Vercel 文档：https://vercel.com/docs
- 社区论坛：https://github.com/vercel/vercel/discussions
