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
  const breakAfter = new Set([..."'\u201C\u201D,\u3002\u3001\uFF1B\uFF1A\uFF01\uFF1F\u7684\u4E0E\u548C\u53CA\u4E4B\u5728\u4E8E\u4E3A-_-\u2014\u2013\u00B7/ \t"]);
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

function bulletItem(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { line: 312, after: 40 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "SimSun" } })],
  });
}

// ── Table helpers ──
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

// ── Page setup ──
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

// ── Cover config ──
const coverConfig = {
  title: "Aceli LAT AI Agent Operating Rules",
  subtitle: "Mandatory Rules, Confidence Thresholds, and Agent Roles",
  englishLabel: "OPERATING RULES",
  metaLines: [
    "Project: Aceli Africa LAT Platform",
    "Version: 1.0",
    "Date: 2026-06-12",
    "Classification: Confidential",
  ],
  footerLeft: "Aceli Africa",
  footerRight: "Sprint 0 Deliverable",
  palette: P.cover,
};

// ── Rules data ──
const rules = [
  { num: 1, name: "Documentation-first", statement: "No feature build starts without linked requirement IDs. Every code task must reference SRS/FRS/user story/API contract/test case IDs before implementation begins.", rationale: "Ensures all work is traceable to validated requirements, preventing scope creep and unverified functionality.", violation: "Task blocked until requirement linkage is established." },
  { num: 2, name: "Traceability", statement: "Every code task maps to SRS/FRS/user story/API contract/test case IDs. The RTM must be updated for every new task, and traceability must be verifiable at every sprint review.", rationale: "Maintains a verifiable chain from requirement to implementation, enabling audit readiness and impact analysis.", violation: "Sprint increment not accepted." },
  { num: 3, name: "Approval-gate", statement: "Any Salesforce write-back logic requires architect + QA + compliance approval before implementation. This applies to all code that creates, updates, or deletes data in Salesforce.", rationale: "Salesforce is the system of record; unauthorized write-backs risk data integrity and compliance violations.", violation: "Code reverted and approval obtained." },
  { num: 4, name: "No hallucination", statement: "If a platform detail is unknown, create an assumption record; do not invent. Assumptions are logged, reviewed, and either validated or resolved before the dependent work proceeds.", rationale: "Prevents AI agents from fabricating technical details that could lead to incorrect implementations.", violation: "Affected work paused, assumption record created." },
  { num: 5, name: "Human review", statement: "All AI-generated lender updates must stop at reviewer state before commit. No auto-commit, no bypass, no silent write-back.", rationale: "Ensures human oversight of all AI-produced changes to lender data, maintaining accountability and data quality.", violation: "Immediate rollback, incident created." },
  { num: 6, name: "No training", statement: "No protected data enters training or fine-tuning workflows. This includes lender-level, borrower-level, and any personally identifiable data.", rationale: "Compliance with data protection regulations and contractual obligations regarding protected information.", violation: "Immediate data quarantine, security incident." },
  { num: 7, name: "Security-first", statement: "Secrets, tokens, credentials, and tenant settings must never be hardcoded. All sensitive configuration must be managed through approved secrets management.", rationale: "Prevents credential exposure in source code and ensures proper access control management.", violation: "Immediate remediation, security scan." },
  { num: 8, name: "Migration discipline", statement: "No production data migration without dry run, reconciliation report, and rollback plan. Migration scripts must be tested, validated, and approved before execution.", rationale: "Data migration errors can cause irreversible data loss or corruption; disciplined process prevents catastrophic failures.", violation: "Migration blocked until requirements met." },
  { num: 9, name: "Testing", statement: "No story is complete without automated tests or explicit approved test evidence. Manual-only testing requires QA agent and Delivery Orchestrator approval.", rationale: "Ensures verifiable quality and regression protection for all delivered functionality.", violation: "Story not marked complete." },
  { num: 10, name: "Audit", statement: "All meaningful user and AI actions must generate structured logs. Logs must be immutable, exportable, and include correlation IDs, timestamps, actor identity, and action details.", rationale: "Enables audit readiness, incident investigation, and compliance demonstration.", violation: "Affected component fails audit coverage gate." },
  { num: 11, name: "Offline-first", statement: "Field features must degrade gracefully under weak or zero connectivity. Draft persistence, sync queuing, and conflict resolution must be implemented for all field-facing features.", rationale: "Field users operate in low-connectivity environments; features must remain functional without network access.", violation: "Feature fails offline/sync test gate." },
  { num: 12, name: "Definition-of-done", statement: "Code, tests, docs, security checks, and release notes are all required for every increment. No partial completions.", rationale: "Ensures every increment is production-ready with complete documentation and verification.", violation: "Sprint increment not released." },
  { num: 13, name: "Post-coder validation", statement: "All generated code must run through linting, static analysis, unit/integration checks, and architectural policy validation. No code reaches non-dev environments without passing these checks.", rationale: "Automated quality gates catch defects and policy violations before code progresses through environments.", violation: "Code blocked at CI pipeline." },
  { num: 14, name: "No repetition", statement: "Agents must reuse approved modules, templates, and patterns; avoid duplicate implementations. If an existing module serves the purpose, extend it rather than creating a new one.", rationale: "Reduces maintenance burden, ensures consistency, and prevents divergence across the codebase.", violation: "Duplicate code flagged for consolidation." },
  { num: 15, name: "Release governance", statement: "No production release without signed release checklist and rollback plan. Every release must have documented rollback steps, approver sign-off, and deployment evidence.", rationale: "Ensures controlled, auditable releases with the ability to recover from failures.", violation: "Release blocked." },
];

// ── Agent roles data ──
const agentRoles = [
  { role: "Delivery Orchestrator", responsibility: "Program coordination, governance enforcement", approval: "Phase gate approval", escalation: "Scope or timeline risk" },
  { role: "Product Owner", responsibility: "Requirements ownership, prioritization", approval: "Requirement approval", escalation: "Scope change" },
  { role: "Business Analyst", responsibility: "Current-state analysis, user stories", approval: "User story acceptance", escalation: "Ambiguous requirements" },
  { role: "Solution Architect", responsibility: "Architecture decisions, integration design", approval: "Architecture approval", escalation: "Integration risk" },
  { role: "Salesforce Integration Agent", responsibility: "Salesforce API, schema", approval: "Salesforce change approval", escalation: "Schema conflict" },
  { role: "AI/ML Workflow Agent", responsibility: "Transcription, extraction, prompts", approval: "AI workflow approval", escalation: "Accuracy below threshold" },
  { role: "Frontend Engineering Agent", responsibility: "Mobile-first web application", approval: "UI/UX approval", escalation: "UX regression" },
  { role: "Backend/API Engineering Agent", responsibility: "Service layer, APIs", approval: "API contract approval", escalation: "Performance degradation" },
  { role: "Data Migration Agent", responsibility: "Google Sheets migration", approval: "Migration plan approval", escalation: "Data quality issue" },
  { role: "DevSecOps Agent", responsibility: "CI/CD, security, environments", approval: "Environment change approval", escalation: "Security vulnerability" },
  { role: "QA Automation Agent", responsibility: "Testing, quality gates", approval: "Test evidence acceptance", escalation: "Test coverage gap" },
  { role: "Technical Writer Agent", responsibility: "Documentation", approval: "Documentation approval", escalation: "Documentation gap" },
  { role: "Release Manager Agent", responsibility: "Release packaging, governance", approval: "Release approval", escalation: "Release risk" },
  { role: "Change Management Agent", responsibility: "Training, adoption", approval: "Training material approval", escalation: "Adoption risk" },
  { role: "Red Team/Compliance Agent", responsibility: "Security review, compliance", approval: "Compliance sign-off", escalation: "Compliance violation" },
];

// ── Build rules table rows ──
function buildRulesTableRows() {
  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell("Rule #", 8),
        headerCell("Rule Name", 15),
        headerCell("Rule Statement", 40),
        headerCell("Rationale", 22),
        headerCell("Violation Consequence", 15),
      ],
    }),
  ];
  for (const r of rules) {
    rows.push(new TableRow({
      cantSplit: true,
      children: [
        dataCell(String(r.num), 8),
        dataCell(r.name, 15),
        dataCell(r.statement, 40),
        dataCell(r.rationale, 22),
        dataCell(r.violation, 15),
      ],
    }));
  }
  return rows;
}

// ── Build agent roles table rows ──
function buildAgentRolesTableRows() {
  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell("Agent Role", 22),
        headerCell("Primary Responsibility", 28),
        headerCell("Approval Authority", 25),
        headerCell("Escalation Trigger", 25),
      ],
    }),
  ];
  for (const a of agentRoles) {
    rows.push(new TableRow({
      cantSplit: true,
      children: [
        dataCell(a.role, 22),
        dataCell(a.responsibility, 28),
        dataCell(a.approval, 25),
        dataCell(a.escalation, 25),
      ],
    }));
  }
  return rows;
}

// ── Standard table border config ──
const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
  left: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
  right: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
};

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
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aceli LAT AI Agent Operating Rules", size: 18, color: "808080" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })] })] }) },
      children: [
        // ── 1. Operating Rules Purpose ──
        heading("1. Operating Rules Purpose"),
        body("This document defines the mandatory operating rules for all AI agents participating in the Aceli LAT production build. These rules are non-negotiable and derive directly from the RFP constraints, the governance model, and the delivery charter. Every AI agent must acknowledge and comply with these rules before executing any task. Violation of any rule triggers immediate escalation and remediation."),

        // ── 2. The 15 Mandatory Agent Rules ──
        heading("2. The 15 Mandatory Agent Rules"),
        body("Each rule is documented with its rule number, rule name, rule statement, rationale, and violation consequences. The following table presents all fifteen mandatory rules that govern AI agent behavior throughout the Aceli LAT production build."),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: buildRulesTableRows(),
        }),

        // ── 3. Confidence and Escalation Thresholds ──
        heading("3. Confidence and Escalation Thresholds"),
        body("Agent confidence levels govern autonomous action: Confidence above 0.90 allows autonomous execution within approved scope; the agent may proceed and report results. Confidence 0.70 to 0.89 allows autonomous draft with mandatory peer-agent review; the agent produces work product but must obtain peer review before finalization. Confidence below 0.70 requires the agent to stop and escalate to human-in-the-loop or lead architect review; no autonomous work product is produced. Security, data governance, and production data tasks always require human review regardless of confidence level."),

        // ── Confidence Thresholds Table ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Confidence Range", 20),
                headerCell("Action", 40),
                headerCell("Conditions", 40),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("> 0.90", 20), dataCell("Autonomous execution within approved scope", 40), dataCell("Agent may proceed and report results", 40)] }),
            new TableRow({ cantSplit: true, children: [dataCell("0.70 \u2013 0.89", 20), dataCell("Autonomous draft with mandatory peer-agent review", 40), dataCell("Agent produces work product but must obtain peer review before finalization", 40)] }),
            new TableRow({ cantSplit: true, children: [dataCell("< 0.70", 20), dataCell("Stop and escalate to human-in-the-loop or lead architect", 40), dataCell("No autonomous work product is produced", 40)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Any level", 20), dataCell("Human review required", 40), dataCell("Security, data governance, and production data tasks always require human review regardless of confidence level", 40)] }),
          ],
        }),

        // ── 4. Agent Role Definitions ──
        heading("4. Agent Role Definitions"),
        body("The following table defines each agent role, its primary responsibility, approval authority, and escalation trigger. Every agent operating within the Aceli LAT production build must be assigned to one of these defined roles and must operate within the boundaries specified herein."),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: buildAgentRolesTableRows(),
        }),

        // ── 5. Inter-Agent Communication Protocol ──
        heading("5. Inter-Agent Communication Protocol"),
        body("Agents communicate through structured channels designed to ensure transparency, accountability, and coordination across the production build. The following communication mechanisms are mandatory for all agent interactions:"),

        bulletItem("Daily automated sync: status, blockers, dependencies, and quality metrics published to shared dashboard"),
        bulletItem("Sprint backlog: tasks assigned with requirement IDs, acceptance criteria, and definition of done"),
        bulletItem("Peer review requests: formal request for review with context, deadline, and expected feedback type"),
        bulletItem("Escalation: structured escalation with confidence level, impact assessment, and recommended action"),
        bulletItem("Release coordination: release checklist, deployment evidence, and rollback plan shared across affected agents"),

        body("All communication must be structured, traceable, and accessible to the Delivery Orchestrator and governance bodies. Informal or unlogged communication does not constitute an approved coordination mechanism."),

        // ── 6. Violation Handling ──
        heading("6. Violation Handling"),
        body("Rule violations are classified into three severity levels, each with defined response protocols:"),

        heading("6.1 Minor Violations", HeadingLevel.HEADING_2),
        body("Minor violations do not affect data integrity, security, or audit readiness. They are logged and remediated within the sprint in which they are identified. The responsible agent must document the violation, its root cause, and the corrective action taken."),

        heading("6.2 Major Violations", HeadingLevel.HEADING_2),
        body("Major violations affect data integrity, security, or audit readiness. They require immediate escalation, a remediation plan, and affected work is paused until resolved. The Delivery Orchestrator must be notified within four hours of identification."),

        heading("6.3 Critical Violations", HeadingLevel.HEADING_2),
        body("Critical violations involve an active data breach, security incident, or compliance violation. They require immediate escalation to human-in-the-loop, the affected component is quarantined, and incident response is initiated. All critical violations are reported to the program sponsor within one hour."),

        // ── Violation Classification Table ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Severity", 15),
                headerCell("Criteria", 35),
                headerCell("Response Protocol", 35),
                headerCell("Reporting Timeline", 15),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("Minor", 15), dataCell("Does not affect data integrity, security, or audit readiness", 35), dataCell("Logged and remediated within the sprint", 35), dataCell("Within sprint", 15)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Major", 15), dataCell("Affects data integrity, security, or audit readiness", 35), dataCell("Immediate escalation, remediation plan required, affected work paused", 35), dataCell("Within 4 hours", 15)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Critical", 15), dataCell("Active data breach, security incident, or compliance violation", 35), dataCell("Immediate escalation to human-in-the-loop, component quarantined, incident response initiated", 35), dataCell("Within 1 hour", 15)] }),
          ],
        }),

        body("All violations are logged in the program risk register and reviewed at weekly governance meetings. The Red Team/Compliance Agent is responsible for independent verification that violations have been properly classified, escalated, and remediated."),
      ],
    },
  ],
});

// ── Write file ──
const outPath = "/home/z/my-project/download/sprint0/Aceli_LAT_AI_Agent_Operating_Rules.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("AI Agent Operating Rules generated successfully at:", outPath);
});
