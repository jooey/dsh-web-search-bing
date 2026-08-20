# dsh-web-search-bing

DSH web plugin：为 `ctx.web` 注册两个 bing 搜索 provider。

- `bing-cn` — 国内版结果（`cn.bing.com`，直链干净）
- `bing-intl` — 国际版结果（同端点 + `ensearch=1`，自动解 `bing.com/ck/a` 重定向还原真实 URL）

零 key、零费用；解析 `b_algo` 结果块，Bing 改版导致解析为 0 条时会明确报错而不是静默返回空。

## 安装

```bash
./install.sh          # 装进 web profile；不改主力 provider
```

## 组合行配置（可选）

```yaml
- id: web-search-bing
  name: 'dsh-web-search-bing'
  config:
    timeoutMs: 15000   # 默认
    fetchCount: 16     # 单次请求条数上限 8-30，默认 16
```

## 切主力

编辑 `~/.dsh/profiles/web/cordis.patch.yml` 的 `web` 行：

```yaml
- id: web
  config:
    searchProvider: bing-cn    # 或 bing-intl / tavily / deepseek-official
```

重启生效。多 provider 并存没问题——`searchProvider` 明确指定谁就是谁。
