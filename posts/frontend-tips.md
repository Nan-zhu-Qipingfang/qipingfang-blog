# 前端开发技巧 💡

总结了一些日常前端开发中实用的技巧和最佳实践。

## CSS 技巧

### 1. 居中布局

现代 CSS 让居中变得简单：

```css
.center {
    display: flex;
    justify-content: center;
    align-items: center;
}

/* 或使用 grid */
.center-grid {
    display: grid;
    place-items: center;
}
```

### 2. 响应式字体

使用 `clamp()` 实现流体字体：

```css
.responsive-text {
    font-size: clamp(1rem, 2vw, 1.5rem);
}
```

### 3. 毛玻璃效果

```css
.glass {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
```

## JavaScript 技巧

### 1. 防抖函数

```javascript
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
```

### 2. 数组去重

```javascript
// 使用 Set
const unique = [...new Set(array)];

// 或使用 filter
const unique = array.filter((item, index) => 
    array.indexOf(item) === index
);
```

### 3. 本地存储封装

```javascript
const storage = {
    get: (key) => JSON.parse(localStorage.getItem(key)),
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    remove: (key) => localStorage.removeItem(key)
};
```

## 性能优化

> 性能优化是一个持续的过程。

1. **图片优化** - 使用 WebP 格式，懒加载
2. **代码分割** - 按需加载模块
3. **缓存策略** - 合理使用 localStorage
4. **减少重绘** - 使用 CSS transform

## 调试技巧

- 使用 `console.table()` 查看数组/对象
- 使用 `console.time()` 测量性能
- 使用浏览器 DevTools 的 Performance 面板

## 总结

掌握这些技巧可以让你的开发工作更加高效！

---

*持续更新中...*
