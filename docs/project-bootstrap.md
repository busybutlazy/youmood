# Project Bootstrap — 我的預設起手式

> **這是個人 SOP，不是方法論主張**。內容是下次開中大型專案時的**預設**做法，作為 diff target — 每次新專案都要主動問「這步要不要做？為什麼？」然後 override，而不是照抄。

---

## 適用範圍

- 跨 2+ repo
- 多服務互相呼叫
- 預期工期 > 2 個月
- 多人協作或預期要 hand-off
- Schema 會 propagate 到多個 phase

## 不適用

- 單人 PoC / prototype
- < 2 週的工具
- 探索性研究（規格還沒清楚 → contract freeze 是 over-commit）
- 一次性 migration script
- 內部 library / utility

如果在不適用情境硬套這套，會比沒有 playbook 還慢。**「playbook 說了所以照做」是 anti-pattern**。

---

## Week 1 — Foundation（動 code 之前）

> 核心紀律：**第一週不寫 production code**。寫的是讓後續 code 不會被 schema / contract drift 拖死的基礎。

### Day 1–2: Problem brief + 需求對應表

產出：

- 一頁 problem statement（這專案存在的理由 + 不解決的問題）
- **Non-goals 明確列出**（沒列出來就會被偷渡進需求）
- **需求 → phase 對應表**：

  | Stakeholder 需求 | 對應 phase |
  |---|---|
  | ... | ... |

  這張表是後續被問「為什麼有 phase N」的標準答案。每個 phase 必須能回溯到至少一條需求。

- **設計原則**（後續所有 phase 都要遵守的不變條款）：
  - 寫 3–5 條，每條一句話
  - 抽象範例：「服務 A 維持資料層定位，業務邏輯一律住服務 B」「跨服務呼叫 stateless」「每個 entity 必帶 tenant_id」「底層服務只長領域中立 primitives，不長業務語義」
  - 後續 phase 違反任何一條 → 寫進 phase doc 風險段顯式解釋為什麼例外

### Day 3–4: Schema audit（一次盤點清楚）

**這步在過去經驗中 ROI 最高**，省下後續所有「邊改 schema 邊改 API」的 blast radius。

產出：

- 既有 schema 全表 dump（`SHOW CREATE TABLE` / collection schema export）+ 註解標「現況可用 / 需擴充 / 需重設計」
- **後續所有 phase 預計動的 schema 一次列出**：
  - 哪個 phase 加什麼欄位 / 表 / collection
  - 哪些 ALTER 順序有依賴關係
  - 哪些既有資料需要 backfill
- DDL 草案（欄位、index、外鍵關係），**不執行 migration**
- 對既有資料的相容性處理（例如：核心表加敏感欄位 → 舊資料初始化策略 / migration 對既有用戶的影響）

完成判準：**後續任何 phase 啟動前，schema 不應該需要被重新設計**，只增加 code。

### Day 5–7: Contract freeze（multi-repo only）

如果是單 repo 專案這段跳過。

產出：

- `contracts/` 資料夾，每份契約一檔。常見起手清單（依專案性質取捨）：
  - `auth.md` — JWT / service token / authn 邊界 / token rotation
  - `db-schema.md` — schema 全盤點 + 變更計畫
  - `events.md` — event schema + types 清單 + idempotency 公式
  - `permissions.md` / `quota.md` — RBAC、配額之類的權限契約
  - `primitives.md` — 跨服務 API 完整契約（每個 endpoint + error code 表）
  - 領域專屬契約（領域 entity 生命週期 / pipeline 設定 / 業務規則）

- `contracts/README.md` 必須含：
  - **修訂規則**（誰能改 / 何時 bump major vs minor）
  - **Mirror rule**（canonical 在哪個 repo，鏡像強制同步）
  - **編號方式**（v1 / v2 / v2.1）
- 每份契約頂部寫版本號

**關鍵紀律**：
- Contract bump **取代**「發明新概念」。穩定概念數量比創新表達自由更重要。
- 兩 repo `contracts/*.md` SHA 不一致 = drift 警報。可以寫個 GH Action 自動 diff。

---

## Week 2 — Roadmap

### Phase skeleton 模板

每個 phase doc 開卷只寫骨架（薄一點，細節等該 phase 啟動時補）：

```
## Phase N: <slug>

### 目標
<一句話>

### 對應需求 / 前置 phase
- 需求: 需求對應表 #X
- 前置: P0 / P1 / ...

### 範圍
- repo A: ...
- repo B: ...
- cross-repo: ...

### 完成判準
- 觀察得到的具體現象（不是「跑得起來」）
- 至少一條 end-to-end smoke

### 風險
- ...
- Mitigation: ...

### 規模
<S / M / L>（樂觀 X 天 / 現實 Y 天）
```

### 依賴圖 + 平行軸

畫一個 ASCII 軸圖：

```
FE 軸:        P1 ── P2-FE ── P3-FE ── ...
BE 軸:        P2-BE ── P3-BE ── P4-BE ── ...
資料 / RAG 軸: P0 ── P5a ── P5b ── ...
agent 軸:                            P5a + P4 ──> P6
```

標出：
- 主軸 + 平行化建議（誰特質適合哪軸）
- **匯流點**（哪個 phase 依賴前面 N 條軸都完成才能啟動）

### Timeline 估計（樂觀 / 現實雙欄）

兩欄寫，不要單欄。範例格式：

| 樂觀 | 現實 |
|---|---|
| 4–5 個月 | 6–8 個月 |

寫雙欄逼自己面對不確定性。單欄會被自然樂觀偏誤帶歪。

### 「已決議事項」表 = de facto ADR ledger

`roadmap.md` 留一段 §「已決議事項」。每條格式：

```
| ADR-NNN | 議題 | 決議 + 為什麼 + 放棄的方案 |
```

**強制紀律**：
- 有 ID（ADR-001 / ADR-002 ...），方便交叉引用
- **顯式寫 rejected alternative**（沒這條就不是 ADR，只是決策清單）
- **反向決策必寫**（從 scheme A 改 C，從加欄位改純刪）— 反向決策是經驗最濃的部分

不開 `docs/adr/` 獨立資料夾，直到：
- ADR 超過 10 條
- 單條 > 1 頁
- 跨專案引用某條
- 新成員需要快速理解歷史決策

---

## During execution — 紀律

### Per-phase rhythm

每個 phase 走同一套節奏：

```
W0: contract bump (如需要)
  → 兩 repo mirror 同步
  → roadmap ADR ledger 加 entry
W1: schema migration / DDL
W2: impl (wave 拆分 — 多 agent 平行 + integrator 收口)
W3: smoke + dogfood
  → 寫 phase doc 風險段觀察到的新風險
  → ADR ledger 加新 entry
W4 (optional): post-merge patch
```

收尾後 phase doc 加 **「Lessons learned」** 段：

- 過程中發現契約有漏 → 哪幾條 bump
- 過程中發現 schema 不夠 → 補了什麼 ALTER
- 過程中走了什麼回頭路 → 寫成 anti-pattern card 進個人 inbox

### Contract bump 紀律

- 任何重大決策 → bump 對應 contract 版本
- bump 不是「改個小字」，bump 是「契約上的承諾變了」
- bump 完同時更新兩 repo（canonical + mirror）
- bump 寫 changelog 段（who / when / why / 影響哪些 phase）

### Invariant ID 索引

散落在各 contracts 的約束用 ID 集中索引。

命名慣例：**單字母 / 短前綴 + 流水號**，前綴對應 domain。範例：

- `K1`, `K2` — knowledge domain 的 invariants
- `F1`, `F7` — FAQ domain 的 invariants
- `V1` — visibility domain
- `PV1`–`PV6` — preview pipeline domain
- ...

每個專案有自己的前綴對照表，放在 `contracts/invariants-index.md` 頂部。

集中放 `contracts/invariants-index.md`，**每條 ID 對應**：
- 一句話描述
- 實作位置（檔案 + line）
- 對應 smoke test
- 違反時的具體症狀

grep ID 立刻找到實作 + 違反路徑。**沒有索引 → invariant 散在 README + comment + 註解，遲早 drift**。

### Feature flag 紀律

開新 feature flag **強制**回答四題（寫進 `docs/ops/feature-flags.md`）：

1. **Owner** — 誰決定退場
2. **Retirement condition** — 「N+M phase 結束」/「100% rollout 30 天無 incident」之類具體條件
3. **Default ramp** — dev / staging / prod 各預設什麼
4. **Removal PR template** — 移除要動哪些檔案、刪哪條分支

詳見個人庫 `inbox.md` 的 `feature-flag-without-retirement` 卡。**沒有四題答案的 flag 不該 merge**。

### Mirror sync 紀律

兩 repo `roadmap.md` + `contracts/*.md` 必須 byte-identical（除了 repo-specific paths）。

操作節奏：
- 改 canonical 一邊
- 同一個 PR 內或下一個 commit 同步 mirror
- PR description 強制標「mirror synced ✅」或「no contract change」

可以寫 GH Action：兩 repo `contracts/*.md` SHA 不一致 → PR comment 標紅。

---

## Per-decision pattern

### 何時寫 ADR

任何「未來會被問為什麼」的決策。具體 trigger：

- 反向決策（scheme A → C）
- Schema 變更 with non-obvious tradeoff
- 跨服務契約 bump
- 引入新 feature flag
- Phase 範圍重新切分
- 既有設計被推翻

「實作細節」**不寫**（git log 已記）。

### 何時 contract bump

- 任何 wire shape 變更
- 任何 invariant 增減
- 任何 endpoint 新增 / 移除 / rename
- Idempotency / retry / dedup 行為變更
- Auth surface 變更

**不 bump** 的情況：
- 純註解 / 排版
- 釐清歧義（且不改實際行為）

### 何時開 phase doc

任何**需要 wave 拆分**或**跨多週**的工作 → 開 phase doc。

不開的情況：
- 單 PR / 單 commit 解掉
- 純 bugfix
- Refactor without behavior change

---

## Per-3-month / per-phase review

每 3 個月 OR 每完成一個大型 phase，做完整 sweep：

- [ ] 個人庫 `inbox.md` 重檢（升級 / 標 stale / 刪除）
- [ ] `feature-flags.md` 退場檢查（哪些 flag 該移除了？）
- [ ] `contracts/` mirror diff（兩 repo SHA 對賬）
- [ ] `invariants-index.md` 死碼盤點（哪些 invariant 已不適用？）
- [ ] ADR ledger 是否需拆檔（>10 條？）
- [ ] 既往 phase docs 的「Lessons learned」段有沒有新 anti-pattern 該寫成卡

---

## Anti-patterns to watch（reference 個人庫 inbox.md）

過程中時時警覺的踩坑模式：

| 觸發場景 | 看哪張卡 |
|---|---|
| 想新增 column / flag 修補單一狀態 | `schema-exception-field-anti-pattern`<br>+ `public-sentinel-remove-not-visibility` |
| 開新 feature flag | `feature-flag-without-retirement` |
| 想自由發明新概念而不 bump contract | `contract-first-before-phase-planning` 的子模式段 |

新專案啟動時，先讀一遍個人庫 inbox.md — 知道哪些坑要避開比知道該做什麼更重要。

---

## 何時打破這份 playbook

這份 SOP 是個人偏好，**不是真理**。打破它的合法時機：

- 某個專案的 stake 不值得這套重量（小 PoC → 跳過 contract freeze）
- 某個專案的不確定性太高（探索性研究 → 不要 freeze schema）
- 團隊規模 / 協作模式不同（單人 vs 多人）
- 領域特性不同（real-time system 的 invariants 結構跟 CRUD service 完全不同）
- Stakeholder 想看的東西不同（demo-driven 專案要先出 vertical slice，不是先 freeze 契約）

每次新專案啟動，**第一個動作是「審視這份 playbook 哪幾段這次不適用」**。寫下來，作為這次的 deviation log。

Deviation log 累積 3+ 次後 → 該升級 / 拆解 / 加 scope tag 進這份 playbook。

---

## Origin / evidence basis

> 這份 SOP 衍生自 2026 年一個跨 2 repo、多服務、約 8 個月工期、含 RAG + agent loop + 多租戶 RBAC 的專案。**N=1**。
>
> 後續驗證 / deviation 記錄會逐步累積。當某個段落被 deviate 3+ 次或被 N=2 不同情境驗證時，該段升級為「elevated discipline」並加明確的 scope tag。
>
> 在此之前，把這份檔案當**起點**而非**規範**。
