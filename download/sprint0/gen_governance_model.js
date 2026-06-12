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
  const breakAfter = new Set([..."\u2018\u2019\u201C\u201D,\u3002\u3001\uFF1B\uFF1A\uFF01\uFF1F\u7684\u4E0E\u548C\u53CA\u4E4B\u5728\u4E8E\u4E3A-_-\u2014\u2013\u00B7/ \t"]);
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
  title: "Aceli LAT Governance Model",
  subtitle: "Decision-Making Framework and Oversight Mechanisms",
  englishLabel: "GOVERNANCE MODEL",
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
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aceli LAT Governance Model", size: 18, color: "808080" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })] })] }) },
      children: [
        // ── 1. Governance Purpose ──
        heading("1. Governance Purpose"),
        body("This Governance Model defines the decision-making framework, authority structures, approval workflows, and oversight mechanisms for the Aceli LAT production build. It ensures that all delivery activities comply with the RFP-aligned delivery constraints, the mandatory agent rules, and the quality gates defined in the Sprint Plan. Governance is not bureaucratic overhead; it is the mechanism by which the program maintains audit readiness, data integrity, and operational safety while delivering at speed."),

        // ── 2. Governance Structure ──
        heading("2. Governance Structure"),
        body("Three-tier governance: Strategic level (Aceli program sponsor and leadership for scope, budget, timeline, and contractual decisions; meets at phase gates and on escalation); Tactical level (Delivery Orchestrator, Solution Architect, and Product Owner for architecture, integration, risk, and cross-sprint dependency decisions; meets weekly); Operational level (individual agent roles for day-to-day technical decisions within their approved scope and confidence thresholds; continuous with daily automated sync)."),

        // ── Governance Structure Table ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            left: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            right: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Level", 20),
                headerCell("Participants", 35),
                headerCell("Decisions and Cadence", 45),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("Strategic", 20), dataCell("Aceli Program Sponsor and Leadership", 35), dataCell("Scope, budget, timeline, and contractual decisions; meets at phase gates and on escalation", 45)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Tactical", 20), dataCell("Delivery Orchestrator, Solution Architect, Product Owner", 35), dataCell("Architecture, integration, risk, and cross-sprint dependency decisions; meets weekly", 45)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Operational", 20), dataCell("Individual Agent Roles", 35), dataCell("Day-to-day technical decisions within approved scope and confidence thresholds; continuous with daily automated sync", 45)] }),
          ],
        }),

        // ── 3. Approval Authority Matrix ──
        heading("3. Approval Authority Matrix"),
        body("The following matrix defines the approval authority for each decision category, specifying the required authority level, approvers, and escalation path."),

        // ── Approval Authority Table ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            left: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            right: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Decision Category", 25),
                headerCell("Authority Level", 20),
                headerCell("Approval Required From", 30),
                headerCell("Escalation Path", 25),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("Scope change", 25), dataCell("Strategic", 20), dataCell("Program Sponsor approval", 30), dataCell("Aceli Leadership", 25)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Architecture change", 25), dataCell("Tactical", 20), dataCell("Solution Architect + Delivery Orchestrator", 30), dataCell("Program Sponsor", 25)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Salesforce write-back logic", 25), dataCell("Tactical", 20), dataCell("Architect + QA + Compliance", 30), dataCell("Program Sponsor", 25)] }),
            new TableRow({ cantSplit: true, children: [dataCell("AI workflow change", 25), dataCell("Tactical", 20), dataCell("AI/ML Agent + Architect", 30), dataCell("Delivery Orchestrator", 25)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Data migration execution", 25), dataCell("Tactical", 20), dataCell("Migration Agent + QA + Delivery Orchestrator", 30), dataCell("Program Sponsor", 25)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Production release", 25), dataCell("Tactical", 20), dataCell("Release Manager + Delivery Orchestrator + QA", 30), dataCell("Program Sponsor", 25)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Security finding remediation", 25), dataCell("Operational/Tactical", 20), dataCell("DevSecOps + Architect", 30), dataCell("Delivery Orchestrator", 25)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Documentation update", 25), dataCell("Operational", 20), dataCell("Technical Writer", 30), dataCell("Delivery Orchestrator", 25)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Environment change", 25), dataCell("Operational", 20), dataCell("DevSecOps", 30), dataCell("Solution Architect", 25)] }),
          ],
        }),

        // ── 4. Quality Gate Enforcement ──
        heading("4. Quality Gate Enforcement"),
        body("Every sprint must pass these gates before the sprint increment is accepted:"),
        bulletItem("Requirements traceability updated in the RTM"),
        bulletItem("Architecture conformance check passed"),
        bulletItem("Security review completed for all changed surfaces"),
        bulletItem("Static analysis and linting passed"),
        bulletItem("Automated tests passed at agreed threshold"),
        bulletItem("Documentation updated"),
        bulletItem("Release notes generated"),
        bulletItem("Rollback plan updated if the release affects the production path"),
        bulletItem("Audit coverage check passed for user and AI flows"),
        body("The Delivery Orchestrator is responsible for gate enforcement. A sprint increment that fails any gate is not released."),

        // ── 5. Change Control ──
        heading("5. Change Control"),
        body("All changes to scope, architecture, integration patterns, or security posture require formal change control. Change requests must include: description, rationale, impact assessment (scope, timeline, risk, documentation), and approver. Changes are classified as:"),
        bulletItem("Minor (operational approval, no scope/timeline impact)"),
        bulletItem("Standard (tactical approval, limited scope/timeline impact)"),
        bulletItem("Major (strategic approval, significant scope/timeline/risk impact)"),
        body("No change is implemented without an approved change request and updated documentation."),

        // ── Change Classification Table ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            left: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            right: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Classification", 20),
                headerCell("Approval Level", 25),
                headerCell("Impact Scope", 55),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("Minor", 20), dataCell("Operational", 25), dataCell("No scope or timeline impact", 55)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Standard", 20), dataCell("Tactical", 25), dataCell("Limited scope and timeline impact", 55)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Major", 20), dataCell("Strategic", 25), dataCell("Significant scope, timeline, and risk impact", 55)] }),
          ],
        }),

        // ── 6. Risk and Issue Management ──
        heading("6. Risk and Issue Management"),
        body("Risks are tracked with probability, impact, mitigation strategy, owner, and status. Issues are defects, blockers, or operational problems requiring resolution. Both are reviewed at weekly governance meetings. Critical risks (high probability, high impact) are escalated immediately to the tactical level. The Red Team/Compliance Agent provides independent risk assessment on security and compliance matters."),

        // ── 7. Compliance and Audit ──
        heading("7. Compliance and Audit"),
        body("All delivery activities must comply with the following non-negotiable constraints:"),

        // ── Compliance Table ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            left: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            right: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Constraint", 40),
                headerCell("Description", 60),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("System of Record", 40), dataCell("Salesforce remains the system of record", 60)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Analytics Layer", 40), dataCell("Power BI remains the analytics layer", 60)] }),
            new TableRow({ cantSplit: true, children: [dataCell("No Shadow Databases", 40), dataCell("No shadow databases or unmanaged exports", 60)] }),
            new TableRow({ cantSplit: true, children: [dataCell("AI Human Review", 40), dataCell("All AI-suggested updates require human review", 60)] }),
            new TableRow({ cantSplit: true, children: [dataCell("AI Audit Logs", 40), dataCell("All AI-assisted decisions produce audit-ready logs", 60)] }),
            new TableRow({ cantSplit: true, children: [dataCell("No Training on Protected Data", 40), dataCell("No protected data enters training workflows", 60)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Approved Tenants", 40), dataCell("All processing runs in approved tenants", 60)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Availability Target", 40), dataCell("99.5% availability target during business hours", 60)] }),
          ],
        }),
        body("The Red Team/Compliance Agent conducts compliance reviews at every sprint boundary and escalates violations immediately."),

        // ── 8. Meeting and Reporting Cadence ──
        heading("8. Meeting and Reporting Cadence"),
        body("The following cadence governs all meeting and reporting activities:"),

        // ── Cadence Table ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            left: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            right: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Cadence", 20),
                headerCell("Scope", 45),
                headerCell("Output", 35),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("Daily", 20), dataCell("Automated AI sync (status, blockers, dependencies, quality)", 45), dataCell("Automated status report", 35)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Weekly", 20), dataCell("Governance review (compliance, scope, architecture, delivery risk)", 45), dataCell("Governance review minutes", 35)] }),
            new TableRow({ cantSplit: true, children: [dataCell("End-of-Sprint", 20), dataCell("Sprint review with working increment, evidence pack, updated docs, and release notes", 45), dataCell("Sprint deliverable pack", 35)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Phase Gates", 20), dataCell("Week 4 design sign-off, Day 90 pilot readiness, Phase 2 entry, Phase 3 entry", 45), dataCell("Phase gate approval", 35)] }),
          ],
        }),

        // ── 9. Escalation and Resolution ──
        heading("9. Escalation and Resolution"),
        body("Agent confidence thresholds govern autonomous action:"),
        bulletItem("Confidence above 0.90 permits autonomous execution within approved scope"),
        bulletItem("Confidence 0.70\u20130.89 permits autonomous draft with mandatory peer-agent review"),
        bulletItem("Confidence below 0.70 requires escalation to human-in-the-loop or lead architect"),
        body("Security, data governance, and production data tasks always require human review regardless of confidence level."),

        // ── Escalation Response Times Table ──
        heading("9.1 Escalation Response Times", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            left: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            right: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Severity", 25),
                headerCell("Description", 40),
                headerCell("Response Time", 35),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("Critical", 25), dataCell("Security or data breach", 40), dataCell("Immediate", 35)] }),
            new TableRow({ cantSplit: true, children: [dataCell("High", 25), dataCell("Production blocker", 40), dataCell("Within 4 hours", 35)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Medium", 25), dataCell("Sprint risk", 40), dataCell("Within 24 hours", 35)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Low", 25), dataCell("Process improvement", 40), dataCell("Next governance review", 35)] }),
          ],
        }),
      ],
    },
  ],
});

// ── Write file ──
const outPath = "/home/z/my-project/download/sprint0/Aceli_LAT_Governance_Model.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("Governance Model generated successfully at:", outPath);
});
