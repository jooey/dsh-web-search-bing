<p align="center">
  <img src="https://img.shields.io/npm/v/dsh-web-search-bing" alt="npm version" />
  <img src="https://img.shields.io/npm/dw/dsh-web-search-bing" alt="npm downloads" />
  <img src="https://img.shields.io/npm/l/dsh-web-search-bing" alt="license" />
</p>

<h1 align="center">dsh-web-search-bing</h1>

<p align="center">
  <strong>Bing 搜索 · 零 Key 零费用 · 国内版 + 国际版双源</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-web-search-bing">npm</a>
  · <a href="https://github.com/jooey/dsh-web-search-bing">GitHub</a>
  · <a href="#安装--install">Install</a>
</p>

---

为 DSH（DeepSeek Harness）的 `ctx.web` 注册两个 bing 搜索 provider。**不申请 Key、不花钱**，装上即用——是付费搜索源（Tavily / DeepSeek 官方）的理想兜底。

## 两个 provider / Two providers

| id | 端点 | 特点 |
|---|---|---|
| `bing-cn` | `cn.bing.com` | 国内版结果，中文查询友好，直链干净 |
| `bing-intl` | 同端点 + `ensearch=1` | 国际版结果，英文技术内容覆盖更好 |

两者都自动解析 `bing.com/ck/a` 重定向还原真实 URL；Bing 改版导致解析结果为 0 条时会**明确报错**而不是静默返回空列表——兜底源最怕的就是悄悄坏掉。

## 实测定位 / Where it fits

与 Tavily 同查询实测：Bing 的强项是**域名多样性**（一次给 8-10 个独立站点）和**免费**；弱项是摘要较短（~100 字）且有时返回品牌首页而非直接答案页。最佳用法是作为 fallback 链的第二三级，或并行模式中与 Tavily 互补（两者中文查询结果几乎零重叠，合并后覆盖面翻倍）。

## 先决条件 / Prerequisites

- 已安装 **DSH**（Node.js >= 20）：`npm install -g @deepseek-ai/dsh`
- 能访问 `cn.bing.com`（无需任何 API Key）

## 安装 / Install

```bash
cd ~/.dsh/profiles/web
pnpm add dsh-web-search-bing
```

在 `~/.dsh/profiles/web/cordis.patch.yml` 追加：

```yaml
- insert:
    - id: web-search-bing
      name: 'dsh-web-search-bing'
```

多 provider 并存没问题，`web` 行的 `searchProvider` 明确指定谁就是谁：

```yaml
- id: web
  config:
    searchProvider: bing-cn    # 或 bing-intl；单用 bing 时才需要这行
```

无 pnpm 时手动安装：把 `lib/` + `package.json` 拷到 `~/.dsh/profiles/node_modules/dsh-web-search-bing/`，加同样的行。

## 组合行配置（可选）/ Config

```yaml
- insert:
    - id: web-search-bing
      name: 'dsh-web-search-bing'
      config:
        timeoutMs: 15000   # 默认
        fetchCount: 16     # 单次请求条数上限 8-30，默认 16
```

## 搭配使用 / Pairs well with

| 插件 | 说明 |
|---|---|
| [`dsh-web-search-strategy`](https://github.com/jooey/dsh-web-search-strategy) | 把 bing 排进 fallback 链或并行组，带策略面板 |
| [`dsh-web-search-tavily-pool`](https://github.com/jooey/dsh-web-search-tavily-pool) | 高质量主力源 + 多 Key 池管理 |

## License

MIT
