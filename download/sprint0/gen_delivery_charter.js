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

function bulletItem(text, ref = "bullet-list") {
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
  title: "Aceli LAT Delivery Charter",
  subtitle: "Production Build Governance and Operating Model",
  englishLabel: "DELIVERY CHARTER",
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
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aceli LAT Delivery Charter", size: 18, color: "808080" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })] })] }) },
      children: [
        // ── 1. Charter Purpose and Authority ──
        heading("1. Charter Purpose and Authority"),
        body("This Delivery Charter establishes the authority, scope, governance, and operating model for the production build of the Aceli Lender Activation Tool (LAT). It is issued by the Delivery Orchestrator and endorsed by the Aceli Africa program sponsor. The charter defines the boundaries within which the multi-agent engineering organization operates and sets the expectations for quality, documentation, traceability, and operational readiness that every sprint must meet."),

        // ── 2. Program Scope ──
        heading("2. Program Scope"),
        body("The program encompasses the end-to-end design, build, test, migration, deployment, and operational handover of the LAT platform across five Aceli Africa countries. The scope includes: a mobile-first responsive web application with offline capabilities; AI-powered transcription and extraction workflows with human-in-the-loop review; controlled Salesforce integration with bidirectional synchronization; a controlled benchmarking data feed pathway; data migration from existing Google Sheets processes; training, change management, and administrator handover; and post-rollout warranty support for a minimum period as defined in the warranty support model."),
        body("The scope explicitly excludes: replacement of Salesforce as the system of record; replacement of Power BI as the analytics layer; training of vendor-owned or third-party models on Aceli data; auto-commit of AI-generated updates without human review; and any shadow databases or unmanaged reconciliation routines."),

        // ── 3. Delivery Model ──
        heading("3. Delivery Model"),
        body("The delivery follows a production-first, documentation-first, audit-ready, human-in-the-loop model. Every sprint must produce working software, controlled documentation, test evidence, and operational artifacts. There are no documentation-only sprints and no code-only sprints. The definition of done requires code, tests, documentation, security checks, and release notes for every increment."),
        body("The sprint cadence is two weeks, with daily automated AI sync for status, blockers, dependencies, and quality updates. Weekly governance reviews cover compliance, scope, architecture, and delivery risk. The program spans 10 sprints across four phases: Phase 0 (Weeks 1-4) for discovery and design; Phase 1 (Weeks 5-13) for pilot build and deployment; Phase 2 (Weeks 14-19) for phased multi-country rollout; and Phase 3 (Weeks 20-24+) for warranty, handover, and continuous improvement."),

        // ── Phase Overview Table ──
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
                headerCell("Phase", 20),
                headerCell("Weeks", 15),
                headerCell("Focus", 65),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("Phase 0", 20), dataCell("1\u20134", 15), dataCell("Discovery and Design", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Phase 1", 20), dataCell("5\u201313", 15), dataCell("Pilot Build and Deployment", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Phase 2", 20), dataCell("14\u201319", 15), dataCell("Phased Multi-Country Rollout", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Phase 3", 20), dataCell("20\u201324+", 15), dataCell("Warranty, Handover, and Continuous Improvement", 65)] }),
          ],
        }),

        // ── 4. Roles and Responsibilities ──
        heading("4. Roles and Responsibilities"),
        body("The delivery organization comprises 15 core agent roles: Delivery Orchestrator (program coordination and governance), Product Owner (requirements ownership and prioritization), Business Analyst (current-state analysis and user stories), Solution Architect (architecture decisions and integration design), Salesforce Integration Agent (Salesforce API and schema work), AI/ML Workflow Agent (transcription, extraction, and prompt engineering), Frontend Engineering Agent (mobile-first web application), Backend/API Engineering Agent (service layer and API development), Data Migration Agent (Google Sheets migration), DevSecOps Agent (CI/CD, security, environments), QA Automation Agent (testing and quality gates), Technical Writer Agent (documentation), Release Manager Agent (release packaging and governance), Change Management Agent (training and adoption), and Red Team/Compliance Agent (security review and compliance validation)."),
        body("Each role has defined responsibilities, approval authorities, and escalation paths. The Delivery Orchestrator maintains the program backlog, manages cross-sprint dependencies, and enforces quality gates."),

        // ── Roles Table ──
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
                headerCell("Role", 35),
                headerCell("Primary Responsibility", 65),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("Delivery Orchestrator", 35), dataCell("Program coordination and governance", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Product Owner", 35), dataCell("Requirements ownership and prioritization", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Business Analyst", 35), dataCell("Current-state analysis and user stories", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Solution Architect", 35), dataCell("Architecture decisions and integration design", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Salesforce Integration Agent", 35), dataCell("Salesforce API and schema work", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("AI/ML Workflow Agent", 35), dataCell("Transcription, extraction, and prompt engineering", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Frontend Engineering Agent", 35), dataCell("Mobile-first web application", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Backend/API Engineering Agent", 35), dataCell("Service layer and API development", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Data Migration Agent", 35), dataCell("Google Sheets migration", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("DevSecOps Agent", 35), dataCell("CI/CD, security, environments", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("QA Automation Agent", 35), dataCell("Testing and quality gates", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Technical Writer Agent", 35), dataCell("Documentation", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Release Manager Agent", 35), dataCell("Release packaging and governance", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Change Management Agent", 35), dataCell("Training and adoption", 65)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Red Team/Compliance Agent", 35), dataCell("Security review and compliance validation", 65)] }),
          ],
        }),

        // ── 5. Quality Gates and Definition of Done ──
        heading("5. Quality Gates and Definition of Done"),
        heading("5.1 Mandatory Quality Gates", HeadingLevel.HEADING_2),
        body("Every sprint must pass the following mandatory quality gates:"),
        bulletItem("Requirements traceability updated"),
        bulletItem("Architecture conformance check passed"),
        bulletItem("Security review completed for changed surfaces"),
        bulletItem("Static analysis and linting passed"),
        bulletItem("Automated tests passed at agreed threshold"),
        bulletItem("Documentation updated"),
        bulletItem("Release notes generated"),
        bulletItem("Rollback plan updated if release affects production path"),
        bulletItem("Audit coverage check passed for user and AI flows"),

        heading("5.2 Definition of Done", HeadingLevel.HEADING_2),
        body("Definition of done requires: code merged, tests passed, documentation updated, release note published, deployment evidence exists, rollback plan exists, and approvers sign off."),

        // ── 6. Governance and Escalation ──
        heading("6. Governance and Escalation"),
        body("The governance model operates at three levels: strategic (program sponsor and Aceli leadership for scope, budget, and timeline decisions), tactical (Delivery Orchestrator and Solution Architect for architecture, integration, and delivery risk decisions), and operational (individual agents for day-to-day technical decisions within approved scope)."),

        heading("6.1 Governance Levels", HeadingLevel.HEADING_2),

        // ── Governance Table ──
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
                headerCell("Decisions", 45),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("Strategic", 20), dataCell("Program Sponsor, Aceli Leadership", 35), dataCell("Scope, budget, and timeline decisions", 45)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Tactical", 20), dataCell("Delivery Orchestrator, Solution Architect", 35), dataCell("Architecture, integration, and delivery risk decisions", 45)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Operational", 20), dataCell("Individual Agents", 35), dataCell("Day-to-day technical decisions within approved scope", 45)] }),
          ],
        }),

        heading("6.2 Escalation Model", HeadingLevel.HEADING_2),
        body("Escalation follows the confidence threshold model: confidence above 0.90 allows autonomous execution within approved scope; confidence 0.70\u20130.89 allows autonomous draft with mandatory peer review; confidence below 0.70 requires escalation to human-in-the-loop or lead architect review. Any security, data governance, or production data task always requires human review."),

        // ── Escalation Table ──
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
                headerCell("Confidence Range", 25),
                headerCell("Action", 75),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("Above 0.90", 25), dataCell("Autonomous execution within approved scope", 75)] }),
            new TableRow({ cantSplit: true, children: [dataCell("0.70 \u2013 0.89", 25), dataCell("Autonomous draft with mandatory peer review", 75)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Below 0.70", 25), dataCell("Escalation to human-in-the-loop or lead architect review", 75)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Security / Data Governance / Production Data", 25), dataCell("Always requires human review regardless of confidence", 75)] }),
          ],
        }),

        // ── 7. Risk Management ──
        heading("7. Risk Management"),
        body("Risks are tracked in a structured risk register with probability, impact, mitigation strategy, and owner. Key program risks include:"),

        // ── Risk Table ──
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
                headerCell("Risk Area", 30),
                headerCell("Mitigation Strategy", 70),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("Connectivity challenges in field environments", 30), dataCell("Robust offline-first architecture", 70)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Salesforce API governance", 30), dataCell("Coordination with Aceli administrators", 70)] }),
            new TableRow({ cantSplit: true, children: [dataCell("AI transcription accuracy for diverse accents", 30), dataCell("Testing and calibration across dialects", 70)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Data migration quality from Google Sheets", 30), dataCell("Full migration sub-program treatment", 70)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Change management and adoption risk", 30), dataCell("Structured training and hypercare", 70)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Legal and information security gating", 30), dataCell("Must be satisfied before sensitive data access", 70)] }),
          ],
        }),

        // ── 8. Communication and Reporting ──
        heading("8. Communication and Reporting"),
        body("Daily AI sync provides automated status, blocker, dependency, and quality updates. Weekly governance reviews cover compliance, scope, architecture, and delivery risk. End-of-sprint outputs include working increment, evidence pack, updated documentation, and release notes. All communications must be traceable and audit-ready."),

        // ── Communication Table ──
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
                headerCell("Cadence", 25),
                headerCell("Scope", 40),
                headerCell("Output", 35),
              ],
            }),
            new TableRow({ cantSplit: true, children: [dataCell("Daily", 25), dataCell("Status, blockers, dependencies, quality", 40), dataCell("Automated AI sync", 35)] }),
            new TableRow({ cantSplit: true, children: [dataCell("Weekly", 25), dataCell("Compliance, scope, architecture, delivery risk", 40), dataCell("Governance review", 35)] }),
            new TableRow({ cantSplit: true, children: [dataCell("End-of-Sprint", 25), dataCell("Increment, evidence, documentation, release notes", 40), dataCell("Sprint deliverable pack", 35)] }),
          ],
        }),

        // ── 9. Charter Acceptance ──
        heading("9. Charter Acceptance"),
        body("This charter is effective upon endorsement by the Aceli Africa program sponsor. Changes to the charter require sponsor approval. The charter will be reviewed and updated at the start of each phase transition."),
      ],
    },
  ],
});

// ── Write file ──
const outPath = "/home/z/my-project/download/sprint0/Aceli_LAT_Delivery_Charter.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("Delivery Charter generated successfully at:", outPath);
});
