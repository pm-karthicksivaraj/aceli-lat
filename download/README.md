# Aceli LAT — Complete Documentation Bundle (Rebid v2.0)

**Bundle Date:** 2026-06-19  
**Prepared for:** Aceli Africa  
**Prepared by:** Goldstone Consortium — Mobipay AgroSys + Karthick Sivaraj  
**Solution Architect & AI Systems Lead:** Karthick Sivaraj  
**Classification:** Confidential

---

## Bundle Contents

This archive contains the complete documentation set for the Aceli LAT (Lender Activation Tool) engagement, including the **rebid v2.0 budget at $92,000** (6.7% under the consortium reference bid of $98,500), the Goldstone-vs-Ours commercial comparison, plus the original 64 sprint deliverables.

### Budget, Comparison & Costing (Top Level)

| File | Description |
|------|-------------|
| `Aceli_LAT_Budget_Timeline_Costing.xlsx` | **Rebid v2.0** — 9-sheet Excel workbook: Cover, Executive Summary, Phase Budget, Resource Costing, Cost by Category, Development Timeline, Payment Milestones, Risk Register, Assumptions. Total: $92,000 fixed price. |
| `Aceli_LAT_Budget_Timeline_Costing.docx` | **Rebid v2.0** — Companion narrative document with executive summary, phase-by-phase breakdown, named team rate card, capex/opex split, 5-milestone billing schedule, risk register, and sign-off block. |
| `Aceli_LAT_Goldstone_vs_Ours_Comparison.xlsx` | **NEW** — Side-by-side comparison: Executive Summary, Technical Comparison, Commercial Comparison, Timeline Comparison, Recommendation. Shows our $92K bid vs Goldstone's $98.5K bid across 14 technical dimensions and 23 commercial line items. |

### Sprint Documentation

| Folder | Sprint | Phase | Files |
|--------|--------|-------|-------|
| `Sprint0_Mobilization/`        | S0 | Initiate  | 9 .docx |
| `Sprint1_Discovery/`           | S1 | Discover  | 9 .docx |
| `Sprint2_Architecture/`        | S2 | Design    | 13 .docx |
| `Sprint3_Foundation/`          | S3 | Build     | 9 .docx |
| `Sprint4_Capture_AI/`          | S4 | Build     | 8 .docx |
| `Sprint5_Review_Sync/`         | S5 | Build     | 8 .docx |
| `Sprint7_Rollout/`             | S7 | Deploy    | 8 .docx |

**Total: 64 sprint deliverables + 3 budget/comparison files + 1 README = 68 documents**

> **Note on Sprint 6:** Sprint 6 deliverables (UAT Plan & Scripts, Integration Test Report, Pilot Runbook, Training Material Drafts, Performance & Security Test Report, Defect Triage Log) were folded into Sprint 7's documentation set as part of the consolidated validation and rollout work.

---

## Headline Financial Summary (Rebid v2.0)

| Metric | Value |
|--------|-------|
| Workstream 1 — LAT Platform | $74,000 |
| Workstream 2 — AI Opportunity Assessment | $10,000 |
| PM, QA, Change Mgmt, Training, Warranty | $8,000 |
| **Total Fixed Price** | **$92,000 USD** |
| Discount vs Goldstone Reference Bid | 6.7% under ($98,500) |
| Total Person-Days | 215 |
| Engagement Window | 22 weeks (06 Jul 2026 → 07 Dec 2026) |
| Pilot Go-Live | Week 11 (2 weeks earlier than reference) |
| Wave 1 Complete | Week 22 (4 weeks earlier than reference) |
| Warranty | 30-day hypercare + 60-day bug-fix (90 days total) |

---

## Three Competitive Differentiators

Our rebid includes three production-grade capabilities **not committed to** in the consortium reference proposal:

1. **Multi-LLM Abstraction** — Claude (Anthropic) primary + GPT-4o (OpenAI) fallback via abstraction layer. No vendor lock-in. Resilience against provider outage.
2. **OpenTelemetry-Native Observability** — Traces from Week 1. Error-budget tracking. PagerDuty integration. Weekly SLO report to Aceli.
3. **Offline-First PWA Architecture** — IndexedDB local queue. Sync-on-reconnect. Works in <100kbps networks. Field-ready day 1.

---

## Document Conventions

- All sprint documents use the GO-1 palette (Graphite Orange) with R1/R4 cover recipes
- All financial figures in USD unless otherwise stated
- Day rates are fully-loaded (salary + benefits + overhead)
- Each sprint folder contains release notes documenting the deliverables
- The budget workbook reconciles to the cent: phase totals = milestone amounts = $92,000

---

## How to Use

1. **For executive review of the rebid:** Open `Aceli_LAT_Budget_Timeline_Costing.docx` (Rebid v2.0)
2. **For financial analysis:** Open `Aceli_LAT_Budget_Timeline_Costing.xlsx` and navigate to Sheet 2 (Executive Summary) for headline KPIs
3. **For the commercial comparison:** Open `Aceli_LAT_Goldstone_vs_Ours_Comparison.xlsx` and start with Sheet 1 (Exec Summary) — the verdict is at the bottom of that sheet
4. **For sprint-level detail:** Drill into Sheet 3 (Phase Budget) of the Excel workbook
5. **For deliverable review:** Navigate to the relevant Sprint folder for design, requirements, or release documentation

---

## Contact

**Solution Architect & AI Systems Lead:** Karthick Sivaraj  
**Team Lead / Business Process:** Brian Jjemba  
**Consortium Lead:** Goldstone Enterprise Consulting & Training Ltd (Uganda)  
**Technology Lead:** Mobipay AgroSys Limited (Uganda)  
**Sponsor:** Aceli Program Director  

For questions about this bundle, contact the Aceli LAT delivery lead.
