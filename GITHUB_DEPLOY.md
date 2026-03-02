# 七平方の Blog - GitHub + Vercel 部署指南

## ✅ 已完成
- [x] Git 仓库已初始化
- [x] 所有文件已提交

---

## 📋 接下来请按以下步骤操作：

### 步骤 1：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写以下信息：
   - **Repository name**: `qipingfang-blog`（或你喜欢的名字）
   - **Description**: 七平方の Blog - 探索技术 · 分享生活 · 记录思考
   - **Public** 或 **Private**（推荐 Public）
   - ❌ 不要勾选 "Add a README file"
   - ❌ 不要勾选 ".gitignore"
3. 点击 **Create repository**

---

### 步骤 2：推送代码到 GitHub

创建仓库后，GitHub 会显示推送命令，执行：

```bash
# 替换为你的 GitHub 用户名
git remote add origin https://github.com/你的用户名/qipingfang-blog.git
git branch -M main
git push -u origin main
```

如果提示输入账号密码，使用 **GitHub Token**：
- 访问 https://github.com/settings/tokens
- 点击 **Generate new token (classic)**
- 勾选 `repo` 权限
- 生成后复制 Token，作为密码使用

---

### 步骤 3：在 Vercel 部署

1. 访问 https://vercel.com/new
2. 点击 **Continue with GitHub** 登录
3. 点击 **Import Git Repository**
4. 找到 `qipingfang-blog` 仓库，点击 **Import**
5. 保持默认设置，点击 **Deploy**

---

### 步骤 4：等待部署完成

- 部署进度可在 **Deployments** 查看
- 部署成功后会显示访问链接
- 格式：`https://qipingfang-blog.vercel.app`

---

## 🔄 后续更新

之后每次修改内容后：

```bash
git add .
git commit -m "更新说明"
git push
```

Vercel 会自动重新部署（约 1-2 分钟）。

---

## 📝 常用 Git 命令

```bash
# 查看状态
git status

# 查看修改
git diff

# 添加文件
git add .

# 提交
git commit -m "说明"

# 推送
git push

# 拉取
git pull
```

---

## ⚠️ 注意事项

1. **posts.json 修改**: 添加/删除文章后记得推送
2. **Markdown 文件**: 在 `posts/` 目录下编辑
3. **自动部署**: 推送到 `main` 分支自动触发

---

## 🎉 完成！

部署成功后，你的博客将可以通过 Vercel 链接访问。

如需绑定自定义域名：
- Vercel Dashboard → Settings → Domains → Add
