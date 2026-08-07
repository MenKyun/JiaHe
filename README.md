# TR SELECT

一个不依赖前端框架的静态独立站，包含商城首页、商品详情、购物车、商品管理和首页可视化编辑器。

## 本地预览

```bash
python3 -m http.server 4173
```

然后打开 `http://localhost:4173/index.html`。

## 管理入口

- `visual-editor.html`：设置首页主图轮播、文案与内容区块。
- `admin.html`：管理商品、图片、SKU、价格和折扣。

当前版本使用浏览器 `localStorage` 保存后台修改和购物车数据，因此数据不会自动同步到其他设备。
