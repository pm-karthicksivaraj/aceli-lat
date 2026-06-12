const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, AlignmentType, HeadingLevel, WidthType,
  BorderStyle, ShadingType, SectionType, NumberFormat, TableOfContents,
  PageBreak, LevelFormat,
} = require("docx");
const fs = require("fs");

// ── Palette: GO-1 (Graphite Orange — proposals) ──
const P = {
  bg: "1A2330", primary: "FFFFFF", accent: "D4875A",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  table: { headerBg: "D4875A", headerText: "FFFFFF", accentLine: "D4875A", innerLine: "DDD0C8", surface: "F8F0EB" },
  body: "#182030", secondary: "#506070", surface: "#F2F4F6",
};
const c = (hex) => hex.replace("#", "");

// ── Cover helpers ──
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 20;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt;
  let lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    const cpl = charsPerLine(minPt);
    lines = splitTitleLines(title, cpl);
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([..." \t-—–/,."]);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}

function calcCoverSpacing(params) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false, metaLineCount = 0, fixedHeight = 800, pageHeight = 16838, marginTop = 0, marginBottom = 0 } = params;
  const SAFETY = 1200;
  const usableHeight = pageHeight - marginTop - marginBottom - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (10 * 23 + 100);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight + metaHeight + fixedHeight + implicitParaHeight;
  const remainingSpace = usableHeight - contentHeight;
  const safeRemaining = Math.max(remainingSpace, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(safeRemaining * 0.45);
  const rawBottom = Math.floor(safeRemaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  const midSpacing = Math.max(safeRemaining - topSpacing - bottomSpacing, 0);
  return { topSpacing, midSpacing, bottomSpacing };
}

function buildCoverR1(config) {
  const CP = config.palette;
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: CP.accent, space: 12 };
  const children = [];
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: CP.accent, space: 8 } },
      children: [new TextRun({ text: config.englishLabel.split("").join("  "), size: 18, color: CP.accent, font: { ascii: "Calibri", eastAsia: "SimHei" }, characterSpacing: 40 })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: CP.titleColor, font: { eastAsia: "SimHei", ascii: "Arial" } })],
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: CP.subtitleColor, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: CP.metaColor, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: CP.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: CP.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: CP.footerColor, font: { ascii: "Arial" } }),
    ],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({ shading: { type: ShadingType.CLEAR, fill: CP.bg }, borders: noBorders, children })],
    })],
  })];
}

// ── Document content helpers ──
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "SimHei" } })],
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "SimSun" } })],
  });
}

function bodyRun(text, opts = {}) {
  return new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "SimSun" }, ...opts });
}

function bodyWithRuns(runs) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 80 },
    children: runs,
  });
}

// ── Table helpers ──
const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
  left: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
  right: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
};

function headerCell(text, widthPct) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: P.table.headerBg },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: P.table.headerBg },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: P.table.headerBg },
      left: { style: BorderStyle.SINGLE, size: 1, color: P.table.headerBg },
      right: { style: BorderStyle.SINGLE, size: 1, color: P.table.headerBg },
    },
    children: [new Paragraph({
      spacing: { line: 312, before: 40, after: 40 },
      children: [new TextRun({ text, bold: true, size: 22, color: P.table.headerText, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })],
    })],
  });
}

function dataCell(text, widthPct) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      left: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      right: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
    },
    children: [new Paragraph({
      spacing: { line: 312, before: 40, after: 40 },
      children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "SimSun" } })],
    })],
  });
}

function dataCellWithRuns(runs, widthPct) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      left: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      right: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
    },
    children: [new Paragraph({
      spacing: { line: 312, before: 40, after: 40 },
      children: runs,
    })],
  });
}

function taggedCell(text, tag, widthPct) {
  // Cell with text + [NEW] or [UPDATED] tag
  const runs = [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "SimSun" } })];
  if (tag === "NEW") {
    runs.push(new TextRun({ text: " [NEW]", size: 22, color: "D4875A", bold: true, font: { ascii: "Times New Roman", eastAsia: "SimSun" } }));
  } else if (tag === "UPDATED") {
    runs.push(new TextRun({ text: " [UPDATED]", size: 22, color: "D4875A", bold: true, font: { ascii: "Times New Roman", eastAsia: "SimSun" } }));
  }
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      left: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      right: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
    },
    children: [new Paragraph({
      spacing: { line: 312, before: 40, after: 40 },
      children: runs,
    })],
  });
}

// ── Build RTM requirement table ──
// Columns: Req ID (10%), Requirement Statement (30%), Source (15%), Priority (15%), Sprint Target (15%), Status (15%)
const colWidths = [10, 30, 15, 15, 15, 15];

function rtmTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell("Req ID", colWidths[0]),
          headerCell("Requirement Statement", colWidths[1]),
          headerCell("Source", colWidths[2]),
          headerCell("Priority", colWidths[3]),
          headerCell("Sprint Target", colWidths[4]),
          headerCell("Status", colWidths[5]),
        ],
      }),
      ...rows.map(r => {
        // r = [reqId, statement, source, priority, sprint, status, tag?]
        const tag = r[6] || null;
        return new TableRow({
          cantSplit: true,
          children: [
            dataCell(r[0], colWidths[0]),
            tag ? taggedCell(r[1], tag, colWidths[1]) : dataCell(r[1], colWidths[1]),
            dataCell(r[2], colWidths[2]),
            dataCell(r[3], colWidths[3]),
            dataCell(r[4], colWidths[4]),
            dataCell(r[5], colWidths[5]),
          ],
        });
      }),
    ],
  });
}

// ── Cross-reference table ──
// Columns: Clarification ID (15%), Topic (25%), Affected Requirements (35%), Sprint Impact (25%)
const ccColWidths = [15, 25, 35, 25];

function ccTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell("Clarification ID", ccColWidths[0]),
          headerCell("Topic", ccColWidths[1]),
          headerCell("Affected Requirements", ccColWidths[2]),
          headerCell("Sprint Impact", ccColWidths[3]),
        ],
      }),
      ...rows.map(r => new TableRow({
        cantSplit: true,
        children: [
          dataCell(r[0], ccColWidths[0]),
          dataCell(r[1], ccColWidths[1]),
          dataCell(r[2], ccColWidths[2]),
          dataCell(r[3], ccColWidths[3]),
        ],
      })),
    ],
  });
}

// ── Page setup ──
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

// ── Cover config ──
const coverConfig = {
  title: "Aceli LAT Requirements Traceability Matrix v1",
  subtitle: "Bidirectional Traceability from RFP to Verification",
  englishLabel: "RTM",
  metaLines: [
    "Project: Aceli Africa LAT Platform",
    "Version: 1.0 (Updated)",
    "Date: 2026-06-12",
    "Classification: Confidential",
    "Incorporates Consortium Clarifications",
  ],
  footerLeft: "Aceli Africa",
  footerRight: "Sprint 0 Deliverable",
  palette: P.cover,
};

// ── Data: RFP-Level Requirements (UPDATED with CL-001 through CL-010) ──
const rfpRows = [
  ["RFP-001", "Salesforce remains the primary system of record for lender relationship data", "RFP Section 3", "Must Have", "Sprint 2 design / Sprint 5 build", "Not Started"],
  ["RFP-002", "LAT platform is the field-facing workflow and intelligence layer", "RFP Section 2", "Must Have", "Sprint 3-4", "Not Started"],
  ["RFP-003", "Power BI remains the analytics and reporting layer only", "RFP Section 3", "Must Have", "Sprint 2 design", "Not Started"],
  ["RFP-004", "Benchmarking data store fed through controlled validated pathway", "RFP Section 4", "Must Have", "Sprint 4-6", "Not Started"],
  ["RFP-005", "No shadow databases, unmanaged exports, or manual reconciliation", "RFP Section 3", "Must Have", "Sprint 0 governance / Sprint 2 design", "Not Started"],
  ["RFP-006", "All AI-suggested updates require human review before write-back", "RFP Section 5", "Must Have", "Sprint 5", "Not Started"],
  ["RFP-007", "All AI-assisted decisions produce audit-ready logs", "RFP Section 5", "Must Have", "Sprint 3-5", "Not Started"],
  ["RFP-008", "No lender/borrower data used to train vendor models", "RFP Section 6", "Must Have", "Sprint 0 governance", "Not Started"],
  ["RFP-009", "All processing within Aceli-approved enterprise tenants", "RFP Section 6", "Must Have", "Sprint 0 governance", "Not Started"],
  ["RFP-010", "Low-bandwidth and offline capture with later synchronization", "RFP Section 7", "Must Have", "Sprint 3-4", "Not Started"],
  ["RFP-011", "99.5% availability during business hours", "RFP Section 7", "Must Have", "Sprint 3+", "Not Started"],
  ["RFP-012", "Training, change management, rollout support, admin handover in scope", "RFP Section 8", "Must Have", "Sprint 6+", "Not Started"],
  // NEW: Consortium Clarification-derived requirements
  ["CL-001", "Pilot country jointly agreed during Phase 0 discovery considering operational readiness, stakeholder availability, lender concentration, implementation practicality, and delivery risk", "Consortium Clarification 6", "Must Have", "Sprint 1", "Not Started", "NEW"],
  ["CL-002", "Transcription and extraction workflows must accommodate regional accents, agricultural terminology, and limited multilingual code-switching including occasional Swahili and local-language phrases", "Consortium Clarification 5", "Must Have", "Sprint 4", "Not Started", "NEW"],
  ["CL-003", "Baseline reconciliation measurement must be established collaboratively during discovery through workflow observation, stakeholder interviews, and practical measurement approaches; methodology and benchmark values jointly agreed", "Consortium Clarification 8", "Must Have", "Sprint 1", "Not Started", "NEW"],
  ["CL-004", "Benchmarking dataset of approximately 60,000 records in Google Sheets connected to Power BI; not being rebuilt; LAT outputs must flow through controlled pathways", "Consortium Clarification 4", "Must Have", "Sprint 4-6", "Not Started", "NEW"],
  ["CL-005", "Salesforce Enterprise Edition with custom objects; LAT scoring framework currently NOT in Salesforce but in Google Sheets; Salesforce sandbox available; Aceli internal Salesforce team will collaborate", "Consortium Clarification 2", "Must Have", "Sprint 2 design", "Not Started", "NEW"],
  ["CL-006", "Platform must accommodate approximately 55 lending institutions across diverse types: commercial banks, local NBFIs, SACCOs, global social lenders; loan sizes US$10K-US$1.5M with SME concentration", "Consortium Clarification 10", "Must Have", "Sprint 2 design", "Not Started", "NEW"],
  ["CL-007", "Country teams operate primarily in intermittent/variable mobile connectivity rather than prolonged offline; platform must support resilient low-bandwidth usage and offline capture where appropriate during field engagement", "Consortium Clarification 3", "Must Have", "Sprint 3-4", "Not Started", "NEW"],
  ["CL-008", "Claude for Nonprofits programme with access to Claude Team/Enterprise; production LLM processing in approved enterprise environments; licensing costs separate from implementation budget", "Consortium Clarification 7", "Must Have", "Sprint 0 governance", "Not Started", "NEW"],
  ["CL-009", "Current LAT is lightweight Google Sheets tool containing activation methodology, scoring framework, assessment questions across six activation areas, and country-level assessments linked to Salesforce reporting; detailed field structures shared under NDA", "Consortium Clarification 1", "Must Have", "Sprint 1 discovery", "Not Started", "NEW"],
  ["CL-010", "Core stakeholder interviews include Product Design, Product Operations, Country Leads, MEL, and Executive Office; external interviews optional but encouraged", "Consortium Clarification 9", "Must Have", "Sprint 1", "Not Started", "NEW"],
];

// ── Data: Business Requirements (UPDATED with BR-006 through BR-009) ──
const brRows = [
  ["BR-001", "Map current Google Sheets LAT process and pain points", "Discovery", "Must Have", "Sprint 1", "Not Started"],
  ["BR-002", "Build current-state process map for all user roles", "Discovery", "Must Have", "Sprint 1", "Not Started"],
  ["BR-003", "Define data domains: lender profile, activation status, narrative notes, extracted updates, review decisions, sync state", "Discovery", "Must Have", "Sprint 1", "Not Started"],
  ["BR-004", "Identify all in-scope and out-of-scope capabilities", "Discovery", "Must Have", "Sprint 1", "Not Started"],
  ["BR-005", "Record assumptions and open questions", "Discovery", "Must Have", "Sprint 1", "Not Started"],
  // NEW: Consortium Clarification-derived business requirements
  ["BR-006", "Establish baseline reconciliation measurement collaboratively with Aceli through workflow observation, stakeholder interviews, and practical measurement approaches", "Consortium Clarification 8", "Must Have", "Sprint 1", "Not Started", "NEW"],
  ["BR-007", "Define pilot country selection criteria and recommendation considering operational readiness, stakeholder availability, lender concentration, implementation practicality, and delivery risk", "Consortium Clarification 6", "Must Have", "Sprint 1", "Not Started", "NEW"],
  ["BR-008", "Map existing LAT schema including activation methodology, scoring framework, and six activation area assessment structure under NDA", "Consortium Clarification 1", "Must Have", "Sprint 1", "Not Started", "NEW"],
  ["BR-009", "Identify Salesforce custom objects for lender relationship management and plan LAT scoring framework integration", "Consortium Clarification 2", "Must Have", "Sprint 1-2", "Not Started", "NEW"],
];

// ── Data: Functional Requirements (UPDATED) ──
const frRows = [
  ["FR-001", "Lender search and profile access UI", "Capture", "Must Have", "Sprint 4", "Not Started"],
  ["FR-002", "Meeting context screen showing lender status and recent activity", "Capture", "Must Have", "Sprint 4", "Not Started"],
  ["FR-003", "Voice memo capture and typed note capture flows", "Capture", "Must Have", "Sprint 4", "Not Started"],
  ["FR-004", "Transcript intake pipeline in approved AI tenant (Claude Team/Enterprise)", "AI", "Must Have", "Sprint 4", "Not Started", "UPDATED"],
  ["FR-005", "Narrative storage and draft extraction workflow", "AI", "Must Have", "Sprint 4", "Not Started"],
  ["FR-006", "Map extracted content into six activation areas", "AI", "Must Have", "Sprint 4", "Not Started"],
  ["FR-007", "Confidence scoring and extraction review flags", "AI", "Must Have", "Sprint 4", "Not Started"],
  ["FR-008", "Reviewer workbench for AI-suggested updates", "Review", "Must Have", "Sprint 5", "Not Started"],
  ["FR-009", "Edit/approve/reject/request-follow-up states", "Review", "Must Have", "Sprint 5", "Not Started"],
  ["FR-010", "Exception queues for missing fields, low confidence, conflicts, invalid transitions, failed sync, and reviewer rejection", "Review", "Must Have", "Sprint 5", "Not Started"],
  ["FR-011", "Controlled Salesforce write-back adapters to custom objects", "Integration", "Must Have", "Sprint 5", "Not Started", "UPDATED"],
  ["FR-012", "Audit timeline and reviewer rationale capture", "Audit", "Must Have", "Sprint 5", "Not Started"],
  ["FR-013", "Offline draft persistence and upload retry for intermittent connectivity", "Offline", "Must Have", "Sprint 4", "Not Started", "UPDATED"],
  ["FR-014", "HQ dashboards and aggregated lender activation views", "HQ", "Must Have", "Sprint 6", "Not Started"],
  ["FR-015", "Controlled export/feed to benchmarking pathway for ~60K record dataset", "Integration", "Must Have", "Sprint 6", "Not Started", "UPDATED"],
  // NEW: Consortium Clarification-derived functional requirements
  ["FR-016", "Transcription and extraction accommodate regional English accents, agricultural terminology, and limited multilingual code-switching including Swahili and local-language phrases", "AI", "Must Have", "Sprint 4", "Not Started", "NEW"],
  ["FR-017", "Flexible data model supporting diverse lender types: commercial banks, NBFIs, SACCOs, social lenders with varying operating models and borrower structures", "Architecture", "Must Have", "Sprint 2 design", "Not Started", "NEW"],
];

// ── Data: Non-Functional Requirements (UPDATED) ──
const nfrRows = [
  ["NFR-001", "Mobile-first responsive web application or PWA", "Architecture", "Must Have", "Sprint 3", "Not Started"],
  ["NFR-002", "99.5% availability during business hours", "Operations", "Must Have", "Sprint 3+", "Not Started"],
  ["NFR-003", "Resilient low-bandwidth operation and offline capture for intermittent connectivity; graceful degradation during field engagement and travel", "Architecture", "Must Have", "Sprint 3-4", "Not Started", "UPDATED"],
  ["NFR-004", "Role-based access control aligned to country, HQ, executive, product owner roles", "Security", "Must Have", "Sprint 3", "Not Started"],
  ["NFR-005", "Immutable audit logs for all user and AI actions", "Security", "Must Have", "Sprint 3-5", "Not Started"],
  ["NFR-006", "Idempotent integration design for sync/retry paths", "Architecture", "Must Have", "Sprint 3-5", "Not Started"],
  ["NFR-007", "Structured logs with correlation IDs", "Operations", "Must Have", "Sprint 3", "Not Started"],
  ["NFR-008", "Feature flags for risky rollout paths", "Architecture", "Should Have", "Sprint 3", "Not Started"],
  // NEW: Consortium Clarification-derived non-functional requirements
  ["NFR-009", "AI processing runs within Aceli-approved Claude Team/Enterprise environments; no data used for model training", "Security", "Must Have", "Sprint 0 governance", "Not Started", "NEW"],
  ["NFR-010", "Platform licensing costs identified and managed separately from implementation budget", "Operations", "Must Have", "Sprint 0", "Not Started", "NEW"],
];

// ── Data: Consortium Clarification Cross-Reference ──
const ccRows = [
  ["CC-01", "LAT Schema and Field Structure", "BR-008, CL-009", "Sprint 1"],
  ["CC-02", "Salesforce Object Model", "BR-009, FR-011, CL-005", "Sprint 1-2"],
  ["CC-03", "Offline-First Operating Conditions", "FR-013, NFR-003, CL-007", "Sprint 3-4"],
  ["CC-04", "Benchmarking Data Pathway", "FR-015, CL-004", "Sprint 4-6"],
  ["CC-05", "Language and Code-Switching", "FR-016, CL-002", "Sprint 4"],
  ["CC-06", "Pilot-Country Selection", "BR-007, CL-001", "Sprint 1"],
  ["CC-07", "Claude Team/Enterprise", "FR-004, NFR-009, CL-008", "Sprint 0"],
  ["CC-08", "Baseline Capture Methodology", "BR-006, CL-003", "Sprint 1"],
  ["CC-09", "Interview Scope", "BR-005, CL-010", "Sprint 1"],
  ["CC-10", "Lender Client Segment", "FR-017, CL-006", "Sprint 1-2"],
];

// ── Build Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimSun" }, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.body) }, paragraph: { spacing: { before: 360, after: 160, line: 312 } } },
      heading2: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.body) }, paragraph: { spacing: { before: 240, after: 120, line: 312 } } },
      heading3: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.body) }, paragraph: { spacing: { before: 200, after: 100, line: 312 } } },
    },
  },
  numbering: {
    config: [
      { reference: "bullet-list", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    // ── Section 1: Cover (no page numbers) ──
    {
      properties: { page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR1(coverConfig),
    },
    // ── Section 2: TOC (Roman numerals) ──
    {
      properties: { type: SectionType.NEXT_PAGE, page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })] })] }) },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480, after: 360 }, children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })] }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \"Update Field.\"", italics: true, size: 18, color: "888888" })] }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // ── Section 3: Body (Arabic from 1) ──
    {
      properties: { type: SectionType.NEXT_PAGE, page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aceli LAT Requirements Traceability Matrix v1", size: 18, color: "808080" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })] })] }) },
      children: [
        // ── 1. RTM Purpose ──
        heading("1. RTM Purpose"),
        body("The Requirements Traceability Matrix (RTM) provides bidirectional traceability from RFP requirements and consortium clarifications through business requirements, functional specifications, user stories, API contracts, test cases, and release artifacts. Every requirement must be traceable to its origin and forward to its verification evidence. The RTM is a living document updated at every sprint boundary and is subject to the mandatory quality gate for requirements traceability completeness. No feature build starts without a linked requirement ID in the RTM. This version incorporates clarifications received from the Aceli consortium following the initial RFP review, with new and updated requirements marked accordingly."),

        // ── 2. RTM Structure and Conventions ──
        heading("2. RTM Structure and Conventions"),
        body("Each RTM entry includes: Req ID (hierarchical: RFP-XXX, BR-XXX, FR-XXX, NFR-XXX, US-XXX, CL-XXX for consortium clarification-derived requirements), Requirement Statement, Source (RFP section, BRD section, PRD section, or Consortium Clarification), Priority (Must Have, Should Have, Could Have), Sprint Target, Implementation Artifact (code module, API contract, integration point), Test Case ID(s), Verification Status (Not Started, In Progress, Verified, Deferred), and Notes/Assumptions."),

        // ── 3. RFP-Level Requirements ──
        heading("3. RFP-Level Requirements"),
        body("The following table captures the high-level RFP-derived requirements that form the origin point for all downstream traceability. Consortium clarification-derived requirements (CL-XXX) are included here pending integration into the appropriate requirement category during Sprint 1 detailed analysis:"),
        rtmTable(rfpRows),

        // ── 4. Business Requirements (Initial) ──
        heading("4. Business Requirements (Initial)"),
        body("These business requirements will be expanded and refined during Sprint 1 discovery. New requirements derived from consortium clarifications are included:"),
        rtmTable(brRows),

        // ── 5. Functional Requirements (Initial) ──
        heading("5. Functional Requirements (Initial)"),
        body("These functional requirements will be expanded during Sprint 2. Updated and new entries reflecting consortium clarifications are included:"),
        rtmTable(frRows),

        // ── 6. Non-Functional Requirements (Initial) ──
        heading("6. Non-Functional Requirements (Initial)"),
        body("Non-functional requirements define the quality attributes and constraints of the platform. Updated and new entries reflecting consortium clarifications are included:"),
        rtmTable(nfrRows),

        // ── 7. Traceability Maintenance ──
        heading("7. Traceability Maintenance"),
        body("The RTM is updated at every sprint boundary. New requirements discovered during sprints are assigned IDs and traced forward. Requirements that are deferred or descoped are marked with rationale. The QA Automation Agent validates RTM completeness against test coverage at each sprint review. The Delivery Orchestrator ensures no feature build begins without a linked RTM entry. Consortium clarification-derived requirements (CL-XXX) are integrated into the appropriate requirement category (RFP, BR, FR, NFR) upon detailed analysis in Sprint 1."),

        // ── 8. Consortium Clarification Cross-Reference ──
        heading("8. Consortium Clarification Cross-Reference"),
        body("The following cross-reference table maps each consortium clarification topic to its affected requirements and sprint impact, ensuring bidirectional traceability from clarification to implementation:"),
        ccTable(ccRows),
      ],
    },
  ],
});

// ── Write file ──
const outPath = "/home/z/my-project/download/sprint0/Aceli_LAT_RTM_v1.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("RTM v1 (Updated) generated successfully at:", outPath);
});
