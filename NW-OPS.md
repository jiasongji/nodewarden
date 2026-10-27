# NodeWarden 自部署运维手册（n.rcrc.eu.org）

> 本文件是本 fork 的自维护文档，路径上游不存在，同步合并永不冲突。

## 架构总览

```
用户 Bitwarden 客户端 / Web Vault
        │
        ▼  https://n.rcrc.eu.org
┌─────────────────────────────────────────────┐
│  Cloudflare（賈松記账户 9fa569…aea51）        │
│                                             │
│  Worker: nodewarden        ← 密码库本体      │
│    ├ D1: nodewarden-db     ← 数据（20 张表） │
│    ├ R2: nodewarden-attachments ← 附件      │
│    ├ DO: NotificationsHub / BackupTransfer  │
│    └ cron */5（应用自身任务）                 │
│                                             │
│  Worker: nw-sync-trigger   ← 同步触发器      │
│    └ cron 37 */3 → GitHub API repository_dispatch
└─────────────────────────────────────────────┘
        │ repository_dispatch (PAT: nw-sync-trigger)
        ▼
GitHub jiasongji/nodewarden（fork of shuaiplus/nodewarden）
  Actions: sync-and-deploy（environment: deploy）
    ├ 落后/分叉 → SSH merge 上游（Deploy Key）
    └ npm ci + wrangler deploy（CF API Token）
```

## 外部依赖清单与故障影响（消融验证结论）

| 依赖 | 用途 | 挂了会怎样 | 密码库可用性 |
|---|---|---|---|
| Cloudflare 平台 | 密码库本体 | 全停（唯一硬依赖，与 GitHub/npm 无关） | ❌ |
| 上游 shuaiplus/nodewarden | 获取更新 | 同步停止，现版本继续跑 | ✅ 不受影响 |
| GitHub Actions / API | 同步与部署管道 | 更新暂停；可手动 `gh workflow run` 兜底 | ✅ 不受影响 |
| GitHub PAT `nw-sync-trigger` | 触发同步 | 同步静默停止（见下方巡检） | ✅ 不受影响 |
| CF API Token `nodewarden-github-actions` | CI 部署 | 部署步骤失败并通知 | ✅ 不受影响 |
| npm registry | 构建期依赖 | 部署失败，旧版本继续跑 | ✅ 不受影响 |
| favicon.im / icons.bitwarden.net | 客户端网站图标 | 仅图标不显示（带超时+缓存+多源回退） | ✅ 不受影响 |
| api.yubico.com | YubiKey OTP 验证 | 仅该 2FA 方式不可用 | ✅ 不受影响 |
| eu.org 域名体系 | n.rcrc.eu.org 的上级授权 | 自定义域名解析失效；备用 workers.dev（部分网络不可达） | ⚠️ 需换域名 |

**核心结论**：密码库运行只依赖 Cloudflare 一家；其余全部外部依赖只影响"更新管道"或"可选功能"，均有优雅降级。

## 凭据与密钥清单

| 凭据 | 位置 | 权限范围 |
|---|---|---|
| GitHub 细粒度 PAT `nw-sync-trigger` | CF Worker secret `GH_DISPATCH_TOKEN`（GitHub 令牌页可管理，ID 21808479） | 仅本仓库，仅 Contents 写，永不过期 |
| CF API Token `nodewarden-github-actions` | GitHub Actions env secret（deploy Environment） | Workers 脚本/D1/R2 编辑 + 账户设置读，永不过期 |
| SSH Deploy Key | 同上（`SYNC_SSH_KEY`）+ 本机 `~/.ssh/id_ed25519_nodewarden` | 仅本仓库读写（别名 github.com-nodewarden） |
| JWT_SECRET | Worker nodewarden 的运行时 Secret | — |

Secrets 均放在 `deploy` Environment（仅 sync-and-deploy workflow 可读），上游同步进来的其他 workflow 无法访问。

## 已知平台限制（重要）

- **该 GitHub 账户的原生 schedule 定时被平台压制**（fork 与独立仓库均实测不触发，手动触发正常）。因此同步由 CF Worker `nw-sync-trigger` 驱动；workflow 里保留 `schedule: 23 */3` 作为平台未来解禁时的双保险（并发组已去重）。
- 上游合并用 SSH Deploy Key 而非 GITHUB_TOKEN：上游更新常含 workflow 变更，需要 workflow 权限。

## 日常巡检（建议每月 1 次）

1. **同步心跳**：https://github.com/jiasongji/nodewarden/actions —— `Sync upstream & deploy` 应每 3 小时一条运行记录。若长时间无新记录 → PAT 失效或 Worker 异常，去 GitHub 令牌页 regenerate 后 `wrangler secret put GH_DISPATCH_TOKEN`。
2. **版本追平**：fork 页面应显示 "behind 0"。
3. **服务健康**：`curl -s https://n.rcrc.eu.org/api/config` 返回 JSON 即正常。
4. **备份**：见下节。

## 备份与恢复

```bash
# D1 数据备份（建议每周，或开启 Web Vault 内置备份中心做 WebDAV/S3 自动备份）
export CLOUDFLARE_API_TOKEN=<token>
npx wrangler d1 export nodewarden-db --remote --output backups/nodewarden-db-$(date +%Y%m%d).sql

# 恢复（谨慎）：导入 SQL 到新建 D1 后改 wrangler.toml 绑定再部署
# 附件在 R2 nodewarden-attachments，可用 r2 object get 逐个导出，或依赖内置备份中心
```

彻底重置 = 删 Worker + D1 + R2 桶一起删（只删 Worker 不会清数据，注册邀请码等配置仍在 D1 里）。

## 手动操作速查

```bash
# 立即检查上游并按需部署（不依赖 Worker/PAT）
gh workflow run sync-and-deploy.yml --repo jiasongji/nodewarden
# 强制重新部署（即使无更新）
gh workflow run sync-and-deploy.yml --repo jiasongji/nodewarden -f force_deploy=true

# 本地开发/手动部署
cd Desktop/Dev/SRV/NodeWarden && npm install
npx wrangler deploy          # 自定义域名在 CF 侧绑定，不随配置文件丢失

# 触发器源码
cd Desktop/Dev/SRV/nw-sync-trigger   # GitHub 备份：jiasongji/nw-sync-trigger（私有）
```

## 风险声明

- 自动跟踪上游 main：若上游被入侵，恶意代码会被自动部署到密码库服务端（fork 跟随上游的固有代价，上游 README 亦有免责声明）。缓解：每月巡检时顺带看上游提交；出问题时可手动 reset 到历史 tag 并 force deploy。
- 所有资源（密码库+触发器+域名）集中在同一 Cloudflare 账户：账户异常 = 全部受影响。务必保持 D1 定期备份导出到 Cloudflare 之外。
