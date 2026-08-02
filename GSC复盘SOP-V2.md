# GSC 复盘 SOP - V2

更新日期：2026-07-31

## 目标

用 Google Search Console 判断站点是否被搜索系统看见，并决定下一轮首页、Research、Products 页面如何调整。

V2 口径：

- GSC 是 SEO 曝光的主判断来源。
- 后台 views、Vercel visits、内部点击不等同于搜索验证。
- 不硬删已公开 URL；旧曝光页保留、redirect 或收口到 Research / Products。

## 每周复盘节奏

每周固定看最近 28 天，并记录截图日期和 GSC 数据实际截至日期。

必须记录：

- Total clicks
- Total impressions
- Average CTR
- Average position
- Top queries
- Top pages
- 新增 query
- 新增曝光页面
- 有曝光但 0 点击的页面

## 判断规则

### 1. 曝光增长，点击仍为 0

说明 Google 正在测试页面，但 SERP 表达或排名还不足以拿到点击。

优先动作：

- 优化已有曝光页的 title / seo_description / 首屏表达。
- 强化页面内链到相关 Research 或 Products。
- 不急着新增相近文章。

### 2. 某个 query 连续出现

连续 2 次复盘出现的 query 才进入内容优化候选。

优先级：

- 与业务强相关：进入首页、Research hub 或文章标题优化。
- 部分相关：只放到对应文章，不改全站定位。
- 偏离定位：记录观察，不追。

### 3. 某个页面曝光增长

优先检查：

- 页面 title 是否具体。
- seo_description 是否说清读者会得到什么。
- 首屏 H1 是否包含人群、问题或产品语义。
- 正文是否有自然内链到 Products 或相关 Research。

## 当前 V2 关键词关注

优先保留和观察：

- solo consultant
- solo service business client acquisition strategies
- how to get clients as a solopreneur
- client acquisition without referrals
- manufacturing social lead discovery
- CNC manufacturing lead signals

谨慎处理：

- solo practitioner seo
- how to get seo clients without cold calling

这类词有曝光，但容易把站点误导成 SEO 服务站。只由相关 Research 承接，不作为首页唯一主轴。

## 每次复盘输出格式

```markdown
## GSC 复盘 - YYYY-MM-DD

- 数据窗口：
- 数据实际截至：
- Clicks：
- Impressions：
- CTR：
- Average position：

### Top queries

| Query | Impressions | Clicks | 判断 | 动作 |
| --- | --- | --- | --- | --- |

### Top pages

| Page | Impressions | Clicks | 判断 | 动作 |
| --- | --- | --- | --- | --- |

### 本周动作

1. 
2. 
3. 
```

## 禁止动作

- 不因为单次 query 曝光就改全站定位。
- 不删除已有曝光 URL。
- 不把后台自测访问当成 SEO 成功。
- 不为了转化字段牺牲文章发布轻量性。
