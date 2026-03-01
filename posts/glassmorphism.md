# 液态玻璃设计指南 🎨

液态玻璃（Glassmorphism）是近年来流行的 UI 设计风格。

## 什么是 Glassmorphism？

Glassmorphism 是一种模仿磨砂玻璃效果的设计风格，特点包括：

- 半透明背景
- 模糊效果
- 微妙边框
- 浮动层次感

## 核心 CSS 属性

### backdrop-filter

这是实现玻璃效果的关键：

```css
.glass {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### box-shadow

添加层次感：

```css
box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
```

## 设计原则

> 少即是多。不要过度使用玻璃效果。

1. **适度使用** - 只在关键元素上使用
2. **保持对比** - 确保文字可读性
3. **层次分明** - 用阴影创造深度
4. **色彩和谐** - 背景色彩要柔和

## 浏览器支持

| 浏览器 | 支持情况 |
|--------|----------|
| Chrome | ✅ 支持 |
| Firefox | ✅ 支持 |
| Safari | ✅ 支持 |
| Edge | ✅ 支持 |

## 小结

Glassmorphism 能为界面带来现代感和精致感，但记得要适度使用！

---

*设计愉快！* 🎉
