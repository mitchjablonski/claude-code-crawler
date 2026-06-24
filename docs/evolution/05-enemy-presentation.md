# Increment 05 — V4: Enemy presentation

**Branch:** `evo/05-enemy-presentation` → base `evo/04-card-upgrades` (stacked)
**Pillar:** V (visual identity) · **Commits:** `555c550` (impl), review-fix commit follows

## What it does
Combat enemies now read clearly and with character: a per-enemy ASCII **sigil**, a
fixed-width **HP bar** (`[#####-----]`, red full / grey empty), and **intent
iconography** — `>>` attack · `[]` defend · `^^` buff · `vv` debuff — colored by
category and derived from the next move's effects, alongside the existing move name
+ damage. Pure presentation; no engine/logic/balance change.

### Tokens / fields (semantic, art-mirror-ready)
- `theme.colors.intent` (per `IntentKind`) + `theme.intentIcons` (closed union, `satisfies Record<IntentKind, …>`).
- `theme.hpBar` + `hpBarSegments(hp, maxHp)` (alive ⇒ ≥1 filled; hurt ⇒ never full).
- `theme.colors.hpEmpty`.
- `EnemyDef.sigil?: string` — optional flavor, never read by the engine.
- `intentKindFor()` in CombatScreen categorizes the next move (attack→defend→buff→debuff precedence).

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **156 tests** ✅ (no test changes needed; `EN 3/3`/`next:` anchors intact)
- `play-verify` **PASS**, `usedPotion: true`, `upgradedCard: true`; balance non-degenerate
- Visually confirmed single + **multi-enemy** (2 and a constructed 3-pack) + **depleted bars** + target markers, all within 76 cols

## Review — 3 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Visual | PASS | Bars render cleanly + align across enemies; sigils add character without breaking alignment; intent icons distinct + correctly colored; multi-enemy fits. |
| Regression / scope | PASS | Diff is 4 files (UI + theme + optional `sigil` field + sigil data); `enemies.ts` change is **sigil-only** (no stat changes); no engine logic / RunState / SAVE_VERSION impact. |
| Design | PASS-WITH-NITS | Tokens semantic + robust; `intentKindFor` correct across all 24 enemies (no damage move ever hidden). |

### Findings addressed
1. Removed dead `theme.colors.enemyIntent` token (intent now sourced from `colors.intent[kind]` — single source of truth).
2. Removed an always-false `dimColor={!alive}` on the detail row (inside an `alive` guard).

### Deferred (reasonable)
- Elite/boss multi-line banners (per-enemy sigil gives adequate presence).
- **Block+self-buff** moves render as `defend`, hiding the buff rider — correctly deferred to **D6 (intent variety)**, where a compound/secondary icon can surface it. No damage move is ever mis-flagged.
