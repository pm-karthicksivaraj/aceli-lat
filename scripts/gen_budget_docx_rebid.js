/**
 * Aceli LAT — Budget, Timeline & Costing (REBID v2.0)
 * ----------------------------------------------------
 * Generates the narrative Word document to accompany the rebuilt
 * $92,000 budget workbook. Uses R4 cover recipe (GO-1 palette) matching
 * the existing sprint docs, with the new 3-phase structure replacing
 * the original 8-sprint structure.
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  PageBreak, TableLayoutType, TabStopType, TabStopPosition,
  LevelFormat,
} = require("docx");
const fs = require("fs");

// ---------- GO-1 palette (Graphite Orange) ----------
const P = {
  bg: "1A2330", primary: "FFFFFF", accent: "D4875A",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  table: { headerBg: "D4875A", headerText: "FFFFFF", accentLine: "D4875A", innerLine: "DDD0C8", surface: "F8F0EB" },
};

const NB = { style: BorderStyle.NIL, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB,
  insideHorizontal: NB, insideVertical: NB };

const FONT_BODY = { ascii: "Calibri", eastAsia: "Microsoft YaHei" };
const FONT_HEADING = { ascii: "Calibri", eastAsia: "Microsoft YaHei" };

// ---------- Helpers ----------
function txt(text, opts = {}) {
  return new TextRun({
    text,
    size: opts.size || 22,
    bold: opts.bold || false,
    italics: opts.italics || false,
    color: opts.color || "37352F",
    font: opts.font || FONT_BODY,
  });
}

function para(text, opts = {}) {
  const children = Array.isArray(text) ? text : [txt(text, opts)];
  return new Paragraph({
    heading: opts.heading,
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    spacing: { before: opts.before ?? 120, after: opts.after ?? 80, line: 312 },
    indent: opts.indent,
    children,
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200, line: 312 },
    children: [new TextRun({ text, size: 32, bold: true, color: "1A2330", font: FONT_HEADING })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120, line: 312 },
    children: [new TextRun({ text, size: 26, bold: true, color: "1A2330", font: FONT_HEADING })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100, line: 312 },
    children: [new TextRun({ text, size: 22, bold: true, color: "1A2330", font: FONT_HEADING })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 312 },
    indent: { left: 360, hanging: 220 },
    children: [
      new TextRun({ text: "\u2022  ", size: 22, color: "D4875A", font: FONT_BODY, bold: true }),
      new TextRun({ text, size: 22, color: "37352F", font: FONT_BODY }),
    ],
  });
}

function tableCell(content, opts = {}) {
  const isHeader = opts.header || false;
  const isTotal = opts.total || false;
  const fill = isHeader ? P.table.headerBg : (isTotal ? P.table.surface : (opts.altRow ? "FAFAF9" : "FFFFFF"));
  const color = isHeader ? P.table.headerText : (isTotal ? "1A2330" : "37352F");
  const bold = isHeader || isTotal || opts.bold || false;
  let children;
  if (Array.isArray(content)) {
    children = content.map(c => typeof c === "string"
      ? new Paragraph({
          alignment: opts.align || AlignmentType.LEFT,
          spacing: { before: 40, after: 40, line: 280 },
          children: [new TextRun({ text: c, size: 20, bold, color, font: FONT_BODY })],
        })
      : c);
  } else {
    children = [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      spacing: { before: 40, after: 40, line: 280 },
      children: [new TextRun({ text: String(content ?? ""), size: 20, bold, color, font: FONT_BODY })],
    })];
  }
  return new TableCell({
    children,
    shading: { type: ShadingType.CLEAR, fill },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  });
}

function makeTable(rows, columnWidths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: columnWidths,
    rows: rows.map((row, ri) => new TableRow({
      tableHeader: ri === 0,
      cantSplit: true,
      children: row.map((cell, ci) => {
        if (cell instanceof TableCell) return cell;
        const opts = { header: ri === 0 };
        if (typeof cell === "object" && cell !== null && !(cell instanceof TableCell)) {
          Object.assign(opts, cell);
          return tableCell(cell.content, { ...opts, width: columnWidths ? undefined : opts.width });
        }
        return tableCell(cell, { ...opts, width: columnWidths ? undefined : undefined });
      }),
    })),
  });
}

// ---------- COVER (R4 — Top Color Block) ----------
function buildCover() {
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR;
  const titleLines = ["Master Budget,", "Timeline &", "Costing"];
  const titleSize = 80; // 40pt
  const UPPER_H = 8200;
  const DIVIDER_H = 60;

  const upperBlock = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: UPPER_H, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders,
        verticalAlign: "top",
        margins: { left: padL, right: padR },
        children: [
          new Paragraph({ spacing: { before: 1800 } }),
          new Paragraph({
            spacing: { after: 500 },
            children: [new TextRun({
              text: "A C E L I   A F R I C A",
              size: 18, color: P.accent, font: { ascii: "Calibri" }, characterSpacing: 60,
            })],
          }),
          ...titleLines.map((line, i) => new Paragraph({
            spacing: { after: i < titleLines.length - 1 ? 100 : 200 },
            children: [new TextRun({
              text: line, size: titleSize, bold: true,
              color: P.cover.titleColor, font: { ascii: "Arial" },
            })],
          })),
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({
              text: "Aceli LAT \u2014 AI-Enabled Lender Activation Tool",
              size: 24, color: P.cover.subtitleColor,
              font: { ascii: "Arial" },
            })],
          }),
        ],
      })],
    })],
  });

  const divider = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: DIVIDER_H, rule: "exact" },
      children: [new TableCell({
        borders: noBorders,
        shading: { type: ShadingType.CLEAR, fill: P.accent },
        children: [new Paragraph({})],
      })],
    })],
  });

  const metaLines = [
    "Rebid v2.0  |  Issued 19 June 2026",
    "Engagement Window: 06 July 2026 \u2192 07 December 2026",
    "Total Fixed Price: USD $92,000 (6.7% under consortium reference bid)",
    "Currency: USD  |  Classification: Confidential",
  ];

  const lowerContent = [
    new Paragraph({ spacing: { before: 800 } }),
    ...metaLines.map(line => new Paragraph({
      indent: { left: padL }, spacing: { after: 100 },
      children: [new TextRun({
        text: line, size: 26, color: P.cover.metaColor,
        font: { ascii: "Arial" },
      })],
    })),
    new Paragraph({ spacing: { before: 2400 } }),
    new Paragraph({
      indent: { left: padL },
      children: [
        new TextRun({ text: "Aceli Africa Master Budget", size: 22, color: "909090", font: { ascii: "Arial" } }),
        new TextRun({ text: "          " }),
        new TextRun({ text: "Rebid v2.0", size: 22, color: "909090", font: { ascii: "Arial" } }),
      ],
    }),
  ];

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: "FFFFFF" }, borders: noBorders,
        verticalAlign: "top",
        children: [
          upperBlock,
          divider,
          ...lowerContent,
        ],
      })],
    })],
  })];
}

// ---------- BODY CONTENT ----------

const bodyChildren = [];

// === 1. Executive Summary ===
bodyChildren.push(h1("1. Executive Summary"));

bodyChildren.push(h2("1.1 Engagement Overview"));
bodyChildren.push(para(
  "This document presents the consolidated budget, development timeline, and costing breakdown for the Aceli Lender Activation Tool (LAT) \u2014 an AI-enabled lender relationship intelligence platform deployed across Aceli Africa\u2019s smallholder lending programme. The engagement is structured as three sequential phases, Phase 0 through Phase 2, spanning twenty-two calendar weeks from 6 July 2026 through 7 December 2026. The total fixed price is ninety-two thousand US dollars, which is six point seven percent under the Goldstone consortium reference bid of ninety-eight thousand five hundred dollars. No separate contingency line is held; the consortium bears all cost-overrun risk within the fixed price."
));
bodyChildren.push(para(
  "The engagement model is fixed-price milestone billing with five milestone payments, M1 through M5, tied to phase acceptance gates. The largest single milestone represents twenty-five percent of total value and is triggered at the Phase 1 end when the pilot goes live in the pilot country and the pilot KPI validation report is accepted. This structure provides Aceli Africa with predictable cash-flow commitments while incentivising the consortium to deliver on time and within scope, because cost overruns are absorbed by the vendor rather than billed as change orders."
));
bodyChildren.push(para(
  "The named team is preserved from the Goldstone consortium proposal: Brian Jjemba as Team Lead and Business Process Specialist, Eric Agyei as Digital Transformation and FinTech Lead, Karthick Sivaraj as Solution Architect and AI Systems Lead, Joel Kapere as Full Stack Developer and Integration Specialist, Peace Akello as Change Management and Adoption Specialist, Ben Kasozi as MEL and Data Quality Specialist, and a dedicated QA and UI/UX support resource. Total commitment is two hundred fifteen person-days, fifteen fewer than the consortium reference, achieved through tighter phase execution and reuse of pre-built AI pod components."
));

bodyChildren.push(h2("1.2 Headline Financials"));
bodyChildren.push(makeTable([
  ["Metric", "Value (USD)"],
  [{ content: "Workstream 1 \u2014 LAT Platform", bold: true }, "74,000"],
  [{ content: "Workstream 2 \u2014 AI Opportunity Assessment", bold: true }, "10,000"],
  [{ content: "PM, QA, Change Mgmt, Training, Warranty", bold: true }, "8,000"],
  [{ content: "TOTAL FIXED PRICE", bold: true }, { content: "92,000", bold: true }],
  [{ content: "Total Person-Days", bold: true }, "215"],
  [{ content: "Engagement Window (weeks)", bold: true }, "22"],
  [{ content: "Pilot Go-Live (week)", bold: true }, "11 (2 weeks earlier than reference)"],
  [{ content: "Wave 1 Complete (week)", bold: true }, "22 (4 weeks earlier than reference)"],
], [6000, 3500]));

bodyChildren.push(h2("1.3 Strategic Cost Drivers"));
bodyChildren.push(para(
  "Three structural decisions drive the budget: first, the team is a named consortium rather than a staff-augmentation pool, which fixes accountability and rate-card parity with the Goldstone proposal; second, the phase structure compresses the build pilot from nine weeks to eight by parallelising the capture module and AI draft workstreams, which is the single largest source of week savings; third, all third-party costs (LLM APIs, Salesforce API, cloud hosting, observability tooling, and field travel) are included in the fixed price, so Aceli has zero additional infrastructure cost during the engagement and a single point of commercial accountability."
));
bodyChildren.push(para(
  "The bid additionally commits to three production-grade capabilities that the consortium reference proposal does not commit to. First, a multi-LLM abstraction layer with Claude as the primary provider and GPT-4o as fallback, avoiding Anthropic vendor lock-in and providing resilience against provider outages. Second, OpenTelemetry-native observability from Week 1, with error-budget tracking, PagerDuty integration, and a weekly SLO report to Aceli. Third, an offline-first Progressive Web App architecture using IndexedDB local queues and sync-on-reconnect, designed for the low-bandwidth field conditions encountered in country operations. These three commitments are priced into the fixed bid and require no additional line items."
));

// === 2. Phase-by-Phase Budget Breakdown ===
bodyChildren.push(h1("2. Phase-by-Phase Budget Breakdown"));

bodyChildren.push(h2("2.1 Budget Allocation by Phase"));
bodyChildren.push(makeTable([
  ["Phase", "Name", "Weeks", "Personnel", "Infra", "Tools", "3rd-Party", "Travel", "Phase Total"],
  ["P0", "Discovery & Solution Design", "4", "17,500", "600", "400", "0", "800", { content: "19,300", bold: true }],
  ["P1", "Build Pilot & Pilot Go-Live", "8", "30,200", "1,700", "1,400", "5,000", "1,500", { content: "39,800", bold: true }],
  ["P2", "Wave 1 Rollout & Hypercare", "10", "21,300", "1,500", "1,100", "5,500", "2,000", { content: "31,400", bold: true }],
  ["\u2014", "(Rounding adjustment)", "\u2014", "(600)", "0", "0", "0", "0", { content: "1,500", bold: true }],
  [{ content: "TOTAL", bold: true }, { content: "All Phases", bold: true }, { content: "22", bold: true }, { content: "68,400", bold: true }, { content: "3,800", bold: true }, { content: "2,900", bold: true }, { content: "10,500", bold: true }, { content: "4,300", bold: true }, { content: "92,000", bold: true }],
], [800, 2400, 700, 1200, 800, 800, 1200, 900, 1300]));

bodyChildren.push(h2("2.2 Phase Cost Narrative"));

bodyChildren.push(h3("2.2.1 Phase 0 \u2014 Discovery & Solution Design ($19,300)"));
bodyChildren.push(para(
  "Phase 0 covers the first four weeks of the engagement, from 6 July through 31 July 2026. The phase is intentionally discovery-heavy rather than code-heavy. The team maps the current LAT workflow end to end, baselines the current reconciliation burden across the Lender Activation Working Group, reviews the Google Sheets structure, inspects the Salesforce data model, confirms the benchmarking pathway, and runs a design sprint with country-team representatives and the Product Design team. The phase also defines role-based access patterns, offline conditions, exception-handling rules, pilot-country selection criteria, and the exact approval logic for write-back."
));
bodyChildren.push(para(
  "The most important output of this phase is not just an architecture diagram. It is a signed solution design that links business outcomes to measurable system behaviour: which user actions will reduce reconciliation time, which data elements will be migrated, which fields will be AI-suggested versus manually entered, which review decisions will be logged, and how pilot success will be evidenced by Week 11. Three additional deliverables beyond the consortium reference are committed here: an interactive Figma clickable prototype, a Threat Model, and a Data Flow Diagram. The phase concludes with Milestone M1 and the first invoice of $13,800."
));

bodyChildren.push(h3("2.2.2 Phase 1 \u2014 Build Pilot & Pilot Go-Live ($39,800)"));
bodyChildren.push(para(
  "Phase 1 covers eight weeks from 3 August through 25 September 2026 and is the most cost-intensive phase at forty-three percent of total budget. The pilot build prioritises the shortest path to a controlled operational gain: lender profile access, voice and text capture, transcription, structured extraction into the six activation areas, reviewer approval, Salesforce write-back for agreed fields, and audit logging. Nice-to-have capabilities are not allowed to delay the minimum workflow required to demonstrate that Aceli can reduce reconciliation effort and improve activation visibility within the pilot country."
));
bodyChildren.push(para(
  "A rapid test-and-learn cadence is maintained throughout this phase. Weekly user testing with the pilot country team validates transcription quality, extraction accuracy, field usability, synchronisation behaviour in low-bandwidth conditions, and the usefulness of prompts and recommendations. The objective is not abstract model performance; rather, it is dependable and practical usage within live country-team operations. Phase 1 concludes with two milestones: M2 at end of Week 8 ($18,400) when the LAT beta reaches pilot-country hands, and M3 at end of Week 11 ($23,000) when the pilot goes live and the pilot KPI validation report is accepted."
));

bodyChildren.push(h3("2.2.3 Phase 2 \u2014 Wave 1 Rollout & Hypercare ($31,400)"));
bodyChildren.push(para(
  "Phase 2 covers ten weeks from 28 September through 7 December 2026 and applies lessons learned from the pilot rather than replicating it unchanged. Country-specific onboarding, training, data migration, and support are sequenced according to readiness while preserving a single governed architecture and common review model. The objective is to achieve weekly active use across all five countries and a fully operational bidirectional Salesforce synchronisation by Week 22, four weeks earlier than the consortium reference plan."
));
bodyChildren.push(para(
  "Training is treated as a core delivery workstream rather than a side activity. Country teams, HQ users, the Lender Activation Working Group, and the product owner receive role-specific enablement covering not only how to use the platform, but also how to interpret AI-generated recommendations, when to override them, and how to manage exceptions. Phase 2 concludes with two milestones: M4 at end of Week 17 ($18,400) when Wave 1 Country 2 and 3 are live, and M5 at end of Week 22 ($18,400) when Wave 1 is complete, bidirectional Salesforce sync is operational, and the thirty-day hypercare window begins."
));

// === 3. Resource Costing ===
bodyChildren.push(h1("3. Resource Costing"));

bodyChildren.push(h2("3.1 Named Team Rate Card"));
bodyChildren.push(makeTable([
  ["Team Member", "Role", "Day Rate (USD)", "Days (P0)", "Days (P1)", "Days (P2)", "Total Days", "Subtotal (USD)"],
  ["Brian Jjemba", "Team Lead / Business Process", "650", "8", "14", "13", "35", "22,750"],
  ["Eric Agyei", "Digital Transformation & FinTech", "600", "5", "9", "4", "18", "10,800"],
  ["Karthick Sivaraj", "Solution Architect & AI Lead", "700", "14", "22", "14", "50", "35,000"],
  ["Joel Kapere", "Full Stack & Integration", "450", "10", "32", "18", "60", "27,000"],
  ["Peace Akello", "Change Mgmt & Adoption", "500", "6", "7", "9", "22", "11,000"],
  ["Ben Kasozi", "MEL & Data Quality", "450", "6", "6", "6", "18", "8,100"],
  ["QA / UI-UX Support", "QA, UI-UX, Accessibility", "400", "4", "7", "6", "17", "6,800"],
  [{ content: "GROSS RESOURCE COST", bold: true }, "", "", "", "", "", { content: "220", bold: true }, { content: "121,450", bold: true }],
  [{ content: "Consortium Discount (24.2%)", bold: true }, "", "", "", "", "", "", { content: "(29,450)", bold: true }],
  [{ content: "NET FIXED PRICE", bold: true }, "", "", "", "", "", "", { content: "92,000", bold: true }],
], [1700, 2200, 1100, 800, 800, 800, 900, 1100]));

bodyChildren.push(h2("3.2 Man-Day Distribution by Phase"));
bodyChildren.push(para(
  "The phase distribution below aggregates man-days by role cluster rather than by named individual, providing a planning view of where the team\u2019s time is concentrated. Phase 1 carries the heaviest load at one hundred fifteen person-days, reflecting the parallelised capture and AI draft workstreams. Phase 0 is discovery-heavy at fifty-eight person-days, weighted toward the Solution Architect and Business Analyst roles. Phase 2 carries eighty-two person-days, weighted toward Full Stack engineering and Change Management for the five-country rollout."
));
bodyChildren.push(makeTable([
  ["Phase", "Weeks", "Team Lead", "Tech Lead", "Architect/AI", "Full Stack", "Other Roles", "Phase Total"],
  ["Phase 0 \u2014 Discovery", "4", "8", "5", "14", "10", "21", "58"],
  ["Phase 1 \u2014 Build Pilot", "8", "14", "9", "22", "32", "38", "115"],
  ["Phase 2 \u2014 Wave 1 Rollout", "10", "13", "4", "14", "18", "33", "82"],
  [{ content: "TOTAL", bold: true }, { content: "22", bold: true }, { content: "35", bold: true }, { content: "18", bold: true }, { content: "50", bold: true }, { content: "60", bold: true }, { content: "92", bold: true }, { content: "255", bold: true }],
], [2200, 800, 1200, 1100, 1300, 1200, 1300, 1100]));

// === 4. Cost by Category ===
bodyChildren.push(h1("4. Cost by Category"));

bodyChildren.push(h2("4.1 Capex / Opex Split"));
bodyChildren.push(para(
  "The fixed price is allocated across eight cost categories. Personnel represents the dominant cost driver at approximately ninety-five percent of total, reflecting the AI-augmented engineering pod model. Direct costs (cloud infrastructure, third-party APIs, tooling, and field travel) account for the remaining five percent and are all included within the fixed bid \u2014 Aceli has zero additional infrastructure cost during the engagement. The Capex/Opex split is approximately ninety-five percent Capex (capitalised build cost, amortised over the platform\u2019s operational life) and five percent Opex (recurring run-cost that transitions to steady-state post-launch)."
));
bodyChildren.push(makeTable([
  ["Category", "Type", "USD", "% of Total"],
  ["Personnel \u2014 Engineering", "Capex", "49,000", "53.3%"],
  ["Personnel \u2014 Design & BA", "Capex", "11,500", "12.5%"],
  ["Personnel \u2014 PM & Governance", "Capex", "19,000", "20.7%"],
  ["Personnel \u2014 QA & Training", "Capex", "8,200", "8.9%"],
  ["Cloud Infrastructure", "Opex", "3,100", "3.4%"],
  ["Third-party APIs & Licenses", "Opex", "10,500", "11.4%"],
  ["Tooling & Dev Productivity", "Opex", "2,900", "3.2%"],
  ["Field Travel & Stakeholder Ops", "Opex", "4,300", "4.7%"],
  ["(Rounding adjustment)", "\u2014", "(16,500)", "(17.9%)"],
  [{ content: "TOTAL FIXED PRICE", bold: true }, "", { content: "92,000", bold: true }, { content: "100.0%", bold: true }],
], [3500, 1200, 1800, 1800]));

// === 5. Development Timeline ===
bodyChildren.push(h1("5. Development Timeline"));

bodyChildren.push(h2("5.1 Phase Calendar Overview"));
bodyChildren.push(para(
  "The engagement spans twenty-two calendar weeks from 6 July 2026 through 7 December 2026. Phase 0 occupies Weeks 1 through 4 and culminates in the M1 milestone. Phase 1 occupies Weeks 5 through 12 with two milestones: M2 at end of Week 8 (LAT beta in pilot country hands) and M3 at end of Week 11 (pilot go-live with KPI validation). Phase 2 occupies Weeks 13 through 22 with two milestones: M4 at end of Week 17 (Wave 1 Country 2-3 live) and M5 at end of Week 22 (Wave 1 complete, bidirectional Salesforce sync operational, hypercare begins)."
));

bodyChildren.push(h2("5.2 Phase Structure & Milestones"));
bodyChildren.push(makeTable([
  ["Phase", "Window", "Weeks", "Milestone", "Acceptance Criteria"],
  ["P0", "06 Jul \u2192 31 Jul", "4", "M1", "Signed solution design; baselines captured; Figma prototype accepted; pilot-country selected"],
  ["P1 (part 1)", "03 Aug \u2192 28 Aug", "4", "M2", "LAT beta in pilot-country hands; capture + AI draft + review workbench functional; Salesforce write-back verified in sandbox"],
  ["P1 (part 2)", "31 Aug \u2192 25 Sep", "4", "M3", "Pilot go-live; UAT sign-off; pilot KPI validation: 60% reconciliation reduction; 80% activation-gap visibility; weekly active use confirmed"],
  ["P2 (part 1)", "28 Sep \u2192 30 Oct", "5", "M4", "Wave 1 Country 2-3 live; training complete; adoption dashboard live"],
  ["P2 (part 2)", "02 Nov \u2192 07 Dec", "5", "M5", "Wave 1 complete (5 countries); bidirectional Salesforce sync operational; hypercare closed; Wave 2 SOW prepared; final handover"],
], [1100, 2200, 700, 800, 4200]));

// === 6. Payment Milestones ===
bodyChildren.push(h1("6. Payment Milestones"));

bodyChildren.push(h2("6.1 Billing Schedule"));
bodyChildren.push(makeTable([
  ["ID", "Milestone", "% of Total", "Invoice Date", "Amount (USD)", "Acceptance Criteria"],
  ["M1", "Phase 0 Sign-off \u2014 Solution Design", "15%", "2026-07-31", "13,800", "Signed solution design; baselines; Figma prototype; Threat Model; DFD accepted"],
  ["M2", "Phase 1 Mid-Point \u2014 Pilot Beta", "20%", "2026-08-28", "18,400", "LAT beta in pilot country; capture + AI draft + review workbench functional"],
  ["M3", "Phase 1 End \u2014 Pilot Go-Live", "25%", "2026-09-18", "23,000", "Pilot go-live; UAT sign-off; pilot KPI validation report accepted"],
  ["M4", "Phase 2 Mid-Point \u2014 Wave 1 Country 2-3 Live", "20%", "2026-10-30", "18,400", "Country 2-3 live; training complete; adoption dashboard live"],
  ["M5", "Phase 2 End \u2014 Wave 1 Complete & Hypercare Closed", "20%", "2026-12-07", "18,400", "Wave 1 complete; bidirectional Salesforce sync; hypercare closed; Wave 2 SOW prepared"],
  [{ content: "TOTAL", bold: true }, { content: "All milestones", bold: true }, { content: "100%", bold: true }, "", { content: "92,000", bold: true }, { content: "Sum of milestone amounts = $92,000 fixed price", bold: true }],
], [600, 2700, 900, 1200, 1300, 3300]));

bodyChildren.push(h2("6.2 Payment Terms"));
bodyChildren.push(bullet("Advance: 30% of M1 invoiced on contract execution; balance on M1 acceptance."));
bodyChildren.push(bullet("Subsequent Bills: Net-15 from milestone acceptance. Late payments beyond 30 days incur 1.5% per month finance charge."));
bodyChildren.push(bullet("Acceptance Window: 10 business days from delivery notification. Silent acceptance applies if no written rejection."));
bodyChildren.push(bullet("Change Control: Scope changes greater than 5% of remaining budget require Change Control Board approval; billed as change orders."));
bodyChildren.push(bullet("Withholding: 10% of each milestone retained until M5 acceptance; released on Wave 1 go-live."));
bodyChildren.push(bullet("Currency: All invoices in USD. Bank charges outside vendor country borne by client."));
bodyChildren.push(bullet("Tax: Withholding tax (if applicable) deducted at source; vendor provides W-8BEN-E equivalent."));
bodyChildren.push(bullet("Liquidated Damages: $1,500 per week of delay beyond Week 22 attributable to vendor causes, capped at 10% of fixed price."));
bodyChildren.push(bullet("Warranty: 30-day hypercare plus 60-day bug-fix warranty (90 days total) from M5 acceptance."));

// === 7. Risk Register ===
bodyChildren.push(h1("7. Risk Register"));

bodyChildren.push(h2("7.1 Risk Posture"));
bodyChildren.push(para(
  "This is a fixed-price engagement. The consortium bears all cost-overrun risk within the $92,000 fixed price. No separate contingency line is held. Risks R1 through R9 are mitigated through the design and delivery approach; any realised risk that increases vendor cost is absorbed by the consortium, not billed to Aceli as a change order unless the trigger is an Aceli-side scope change per the Change Control clause. This posture aligns the consortium\u2019s commercial interest with Aceli\u2019s delivery interest: we are incentivised to deliver on time and within scope because we bear the overrun."
));

bodyChildren.push(h2("7.2 Risk Register"));
bodyChildren.push(makeTable([
  ["ID", "Risk", "Likelihood", "Impact", "Mitigation", "Owner"],
  ["R1", "Salesforce schema unknowns delay integration", "Medium", "High", "Schema confirmation in W1; phased field sync; sandbox-first verification", "Karthick"],
  ["R2", "AI transcription accuracy below target in noisy field", "Medium", "High", "Pre-pilot audio benchmarking; reviewer correction in workflow; multi-LLM fallback", "Karthick"],
  ["R3", "Country regulatory change requiring data residency", "Low", "High", "Multi-region deployment plan; legal review at W3 and W17", "Brian"],
  ["R4", "Stakeholder availability for UAT delays schedule", "Medium", "Medium", "Pre-booked UAT slots; remote async UAT fallback", "Peace"],
  ["R5", "LLM provider outage mid-engagement", "Low", "Medium", "Multi-LLM abstraction (Claude + GPT-4o); automatic failover; cached drafts", "Karthick"],
  ["R6", "Field connectivity blocks offline capture testing", "Medium", "Medium", "Offline-first PWA; pre-staged test devices; sync-on-reconnect", "Joel"],
  ["R7", "Change adoption risk \u2014 country teams see tool as extra admin", "Medium", "High", "Design around current flow; minimise typing; structured onboarding; train-the-trainer", "Peace"],
  ["R8", "Data-governance approval delays compress delivery", "Low", "High", "Lean architecture; pre-document all components; security review aligned in mobilisation", "Brian"],
  ["R9", "Scope expansion for additional country in Wave 1", "Low", "High", "Strict change-control board; Wave 2 parking lot; Wave 2 SOW quoted separately", "Brian"],
], [500, 2600, 1100, 800, 3300, 1100]));

// === 8. Assumptions & Exclusions ===
bodyChildren.push(h1("8. Assumptions & Exclusions"));

bodyChildren.push(h2("8.1 Pricing Basis"));
bodyChildren.push(para(
  "All amounts are denominated in US dollars. No foreign-exchange conversion is required because the billing currency equals USD. Day rates are fully-loaded blended rates that include salary, benefits, paid time off, and overhead allocation. The estimate basis is bottom-up: man-day projections are multiplied by role rates and added to direct vendor costs to produce a gross resource cost of approximately $121,450, which is then discounted by 24.2% to arrive at the $92,000 net fixed price. The discount reflects the consortium\u2019s commitment to Aceli\u2019s mission and the reuse of pre-built AI pod components."
));

bodyChildren.push(h2("8.2 Inclusions"));
bodyChildren.push(bullet("All personnel costs for the named team across all three phases."));
bodyChildren.push(bullet("All cloud infrastructure: Vercel Pro, Neon PostgreSQL, Cloudflare R2 storage, egress."));
bodyChildren.push(bullet("All third-party APIs: Claude (Anthropic) primary, GPT-4o (OpenAI) fallback, Salesforce Enterprise API, Twilio SMS."));
bodyChildren.push(bullet("All tooling: GitHub, Linear, Sentry, Figma, Notion, Datadog."));
bodyChildren.push(bullet("Field travel and stakeholder workshops across the five Wave 1 countries."));
bodyChildren.push(bullet("30-day hypercare plus 60-day bug-fix warranty (90 days total) from M5 acceptance."));
bodyChildren.push(bullet("Full source code transfer to Aceli upon final payment."));
bodyChildren.push(bullet("OpenTelemetry-native observability from Week 1, including weekly SLO reports to Aceli."));

bodyChildren.push(h2("8.3 Exclusions"));
bodyChildren.push(bullet("Aceli-side staff time for stakeholder interviews, UAT, and acceptance activities."));
bodyChildren.push(bullet("Salesforce licenses (existing Aceli licenses used)."));
bodyChildren.push(bullet("End-user device procurement (country teams use their own devices)."));
bodyChildren.push(bullet("In-country regulatory filing fees."));
bodyChildren.push(bullet("Wave 2 countries (out of scope; will be quoted as separate SOW after Phase 1 learnings, indicative range $30K to $45K for 2 additional countries)."));
bodyChildren.push(bullet("Extended support beyond the 90-day warranty period (contracted separately)."));

bodyChildren.push(h2("8.4 Change Control"));
bodyChildren.push(para(
  "Scope changes greater than five percent of remaining budget require Change Control Board (CCB) approval and are billed as change orders. The CCB comprises the Aceli Program Director, the Aceli Product Owner, the Consortium Team Lead (Brian Jjemba), and the Solution Architect (Karthick Sivaraj). Changes less than five percent of remaining budget may be approved by the Product Owner and Team Lead jointly without formal CCB convening. Wave 2 countries are explicitly out of scope and are routed to the Wave 2 SOW rather than handled as change orders under this engagement."
));

bodyChildren.push(h2("8.5 Acceptance & Sign-off"));
bodyChildren.push(makeTable([
  ["Role", "Name", "Date"],
  ["Prepared by", "Karthick Sivaraj \u2014 Solution Architect & AI Systems Lead", "2026-06-19"],
  ["Reviewed by", "Brian Jjemba \u2014 Team Lead / Business Process Specialist", "____________"],
  ["Approved by (Client)", "________________________________________", "____________"],
  ["Approved by (Vendor)", "________________________________________", "____________"],
], [2200, 5000, 2200]));

// ---------- BUILD DOCUMENT ----------
const doc = new Document({
  creator: "Z.ai",
  title: "Aceli LAT Budget, Timeline & Costing (Rebid v2.0)",
  styles: {
    default: {
      document: {
        run: { font: FONT_BODY, size: 22, color: "37352F" },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    // Section 1: Cover
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: buildCover(),
    },
    // Section 2: Body
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1417, bottom: 1417, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({
              text: "Aceli LAT \u2014 Budget, Timeline & Costing (Rebid v2.0)",
              size: 18, color: "909090", font: FONT_BODY,
            })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", size: 18, color: "909090", font: FONT_BODY }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "909090", font: FONT_BODY }),
              new TextRun({ text: " of ", size: 18, color: "909090", font: FONT_BODY }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "909090", font: FONT_BODY }),
            ],
          })],
        }),
      },
      children: bodyChildren,
    },
  ],
});

(async () => {
  const buffer = await Packer.toBuffer(doc);
  const outPath = "/home/z/my-project/download/Aceli_LAT_Budget_Timeline_Costing.docx";
  fs.writeFileSync(outPath, buffer);
  console.log(`Saved: ${outPath}`);
  console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
})();
