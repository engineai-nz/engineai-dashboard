# Future Project: Review Ops Platform

**Status:** Parked - build after /adversarial-review skill is proven
**Date captured:** 2026-04-04
**Source:** Adversarial review workflow discussion (Ben + Claude + Codex)

## Vision

Turn the /adversarial-review skill output into a full review operations platform. The database is the product, markdown is just one render target. Findings have lifecycle, ownership, and accountability.

## Core Entities

```
clients > projects > documents > document_versions > review_runs > findings > dispositions > remediation_tasks
```

### Findings Schema (minimum)

| Field | Type |
|---|---|
| title | text |
| category | enum |
| severity | P0-P3 |
| action_type | rewrite / add_section / resolve_contradiction / define_metric / narrow_scope / decision_needed / needs_stakeholder_input |
| confidence | float |
| status | open / sent_to_author / accepted / in_progress / resolved / waived / disputed / regressed |
| author | text (reviewing agent) |
| owner | text (human responsible) |
| source_span | text (section + quote) |
| rationale | text |
| suggested_fix | text |
| created_in_review_run_id | uuid |
| resolved_in_review_run_id | uuid |
| external_task_id | text (Linear issue ID) |

### Finding Lifecycle

`open > sent_to_author > accepted > in_progress > resolved`
Branch states: `waived`, `disputed`, `needs_info`, `regressed`

## Three Destinations Per Review

| Destination | Role |
|---|---|
| Supabase | System of record |
| Git | Immutable artifacts tied to doc version |
| Notion | Client portal (optional, not source of truth) |

## Post-Review Automation

1. Review run completes, findings saved to DB
2. Two outputs rendered: internal report + author brief
3. Reviewer triages: send / track / task / waive
4. Approved items sync to Linear (P0/P1 only, after confirmation)
5. Author notified via Telegram/Discord with brief
6. Re-review compares against prior run, updates statuses

## Consultancy Extensions

- **Tenancy + permissions** - clients see only their docs, runs, briefs
- **Review templates** - PRD, architecture doc, SOW, GTM plan, AI feature spec
- **Benchmarking** - score by category over time ("this team's PRDs improved 31% over 4 rounds")
- **Learning loop** - accepted/rejected findings improve the system per client and doc type

## Prerequisites

- /adversarial-review skill proven through real usage
- Supabase schema designed and reviewed
- Decision on Notion vs git-only for client-facing output
- Linear integration pattern established (from CRM or dashboard work)

## Why

**Why:** The skill generates findings. The platform drives them to closure. Without lifecycle tracking, reviews are one-shot documents that get read once and forgotten. With it, Engine AI can demonstrate measurable improvement in client doc quality over time - a sellable service.

**How to apply:** Build the skill first, ensure JSON output is forward-compatible with this schema. When we have 5+ real review runs, build the platform.
