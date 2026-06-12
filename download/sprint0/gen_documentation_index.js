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
  const breakAfter = new Set([..."'\u201C\u201D,\u3002\u3001\uFF1B\uFF1A\uFF01\uFF1F\u7684\u4E0E\u548C\u53CA\u4E4B\u5728\u4E8E\u4E3A\u2014\u2013\u00B7/ \t"]);
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

function docIndexTable(rows) {
  return new Table({
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
          headerCell("Document Title", 35),
          headerCell("Owner", 20),
          headerCell("Sprint Created", 15),
          headerCell("Current Version", 15),
          headerCell("Status", 15),
        ],
      }),
      ...rows.map(r => new TableRow({
        cantSplit: true,
        children: [
          dataCell(r[0], 35),
          dataCell(r[1], 20),
          dataCell(r[2], 15),
          dataCell(r[3], 15),
          dataCell(r[4], 15),
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
  title: "Aceli LAT Documentation Index",
  subtitle: "Master Index for All Documentation Artifacts",
  englishLabel: "DOCUMENTATION INDEX",
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

// ── Table data ──
const productReqRows = [
  ["Vision Brief", "Delivery Orchestrator", "Sprint 0", "v1.0", "Draft"],
  ["BRD", "Business Analyst", "Sprint 1", "\u2013", "Planned"],
  ["PRD", "Product Owner", "Sprint 1", "\u2013", "Planned"],
  ["SRS", "Solution Architect", "Sprint 2", "\u2013", "Planned"],
  ["FRS", "Solution Architect", "Sprint 2", "\u2013", "Planned"],
  ["NFR Specification", "Solution Architect", "Sprint 2", "\u2013", "Planned"],
  ["User Personas and Stakeholder Matrix", "Business Analyst", "Sprint 1", "\u2013", "Planned"],
  ["User Story Catalogue", "Business Analyst", "Sprint 1", "\u2013", "Planned"],
  ["Acceptance Criteria Catalogue", "QA Agent", "Sprint 2", "\u2013", "Planned"],
  ["Requirements Traceability Matrix", "Delivery Orchestrator", "Sprint 0", "v1.0", "Draft"],
];

const archEngRows = [
  ["Solution Architecture Document", "Solution Architect", "Sprint 2", "\u2013", "Planned"],
  ["Deployment Architecture Document", "DevSecOps", "Sprint 3", "\u2013", "Planned"],
  ["Integration Architecture Document", "Solution Architect", "Sprint 2", "\u2013", "Planned"],
  ["Data Flow Diagram Pack", "Solution Architect", "Sprint 2", "\u2013", "Planned"],
  ["Sequence Diagram Pack", "Solution Architect", "Sprint 2", "\u2013", "Planned"],
  ["RBAC Matrix", "Solution Architect", "Sprint 2", "\u2013", "Planned"],
  ["Offline Sync Design", "Backend Agent", "Sprint 2", "\u2013", "Planned"],
  ["Audit Logging Design", "Backend Agent", "Sprint 2", "\u2013", "Planned"],
  ["AI Prompt/Workflow Specification", "AI/ML Agent", "Sprint 2", "\u2013", "Planned"],
  ["Salesforce Object/Field Mapping Document", "Salesforce Agent", "Sprint 2", "\u2013", "Planned"],
  ["Benchmarking Data Pathway Specification", "Backend Agent", "Sprint 4", "\u2013", "Planned"],
  ["ADRs", "Solution Architect", "Sprint 2+", "\u2013", "Planned"],
];

const deliveryQARows = [
  ["Test Strategy", "QA Agent", "Sprint 3", "\u2013", "Planned"],
  ["Unit Test Plan", "QA Agent", "Sprint 3", "\u2013", "Planned"],
  ["Integration Test Plan", "QA Agent", "Sprint 4", "\u2013", "Planned"],
  ["UAT Plan", "QA Agent", "Sprint 6", "\u2013", "Planned"],
  ["Performance Test Plan", "QA Agent", "Sprint 5", "\u2013", "Planned"],
  ["Security Test Plan", "Red Team", "Sprint 5", "\u2013", "Planned"],
  ["Offline/Sync Test Plan", "QA Agent", "Sprint 4", "\u2013", "Planned"],
  ["Release Readiness Checklist", "Release Manager", "Sprint 6", "\u2013", "Planned"],
  ["Defect Management SOP", "QA Agent", "Sprint 3", "\u2013", "Planned"],
  ["Environment Readiness Checklist", "DevSecOps", "Sprint 3", "\u2013", "Planned"],
  ["Pilot Go-Live Checklist", "Release Manager", "Sprint 6", "\u2013", "Planned"],
  ["Rollout Readiness Checklist per Country", "Release Manager", "Sprint 7+", "\u2013", "Planned"],
];

const opsSupportRows = [
  ["Runbook", "DevSecOps", "Sprint 6", "\u2013", "Planned"],
  ["Incident Management SOP", "DevSecOps", "Sprint 8", "\u2013", "Planned"],
  ["Backup and Restore SOP", "DevSecOps", "Sprint 9", "\u2013", "Planned"],
  ["Disaster Recovery Plan", "DevSecOps", "Sprint 9", "\u2013", "Planned"],
  ["Monitoring and Alerting Guide", "DevSecOps", "Sprint 8", "\u2013", "Planned"],
  ["Support Model and SLA Guide", "DevSecOps", "Sprint 9", "\u2013", "Planned"],
  ["Admin Handover Guide", "Change Management", "Sprint 9", "\u2013", "Planned"],
  ["Warranty Support Guide", "Change Management", "Sprint 9", "\u2013", "Planned"],
  ["Change Management Plan", "Change Management", "Sprint 0", "\u2013", "Planned"],
  ["Training Plan", "Change Management", "Sprint 6", "\u2013", "Planned"],
  ["Training Materials", "Change Management", "Sprint 6", "\u2013", "Planned"],
  ["FAQ / Troubleshooting Guide", "Technical Writer", "Sprint 9", "\u2013", "Planned"],
];

const releaseRows = [
  ["Sprint Release Notes", "Release Manager", "Every Sprint", "\u2013", "Ongoing"],
  ["Pilot Release Notes", "Release Manager", "Sprint 6", "\u2013", "Planned"],
  ["Country Rollout Release Notes", "Release Manager", "Sprint 7+", "\u2013", "Planned"],
  ["Production Release Notes", "Release Manager", "Sprint 6", "\u2013", "Planned"],
  ["Change Log", "Release Manager", "Every Sprint", "\u2013", "Ongoing"],
  ["Known Issues Log", "QA Agent", "Every Sprint", "\u2013", "Ongoing"],
  ["Month-12 Outcome Review Template", "Delivery Orchestrator", "Sprint 10", "\u2013", "Planned"],
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
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aceli LAT Documentation Index", size: 18, color: "808080" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })] })] }) },
      children: [
        // ── 1. Index Purpose and Maintenance ──
        heading("1. Index Purpose and Maintenance"),
        body("The Documentation Index provides a single, authoritative reference for every document produced during the program. Each entry includes the document title, document category, owning agent role, sprint of initial creation, current version, and status. The index is updated at every sprint boundary as part of the mandatory quality gate for documentation completeness. Documents that are superseded or retired are marked accordingly but never removed from the index to maintain a complete audit trail."),

        // ── 2. Product and Requirements Documentation ──
        heading("2. Product and Requirements Documentation"),
        body("The following table lists all product and requirements documentation artifacts for the Aceli LAT program."),
        docIndexTable(productReqRows),

        // ── 3. Architecture and Engineering Documentation ──
        heading("3. Architecture and Engineering Documentation"),
        body("The following table lists all architecture and engineering documentation artifacts for the Aceli LAT program."),
        docIndexTable(archEngRows),

        // ── 4. Delivery and QA Documentation ──
        heading("4. Delivery and QA Documentation"),
        body("The following table lists all delivery and quality assurance documentation artifacts for the Aceli LAT program."),
        docIndexTable(deliveryQARows),

        // ── 5. Operations and Support Documentation ──
        heading("5. Operations and Support Documentation"),
        body("The following table lists all operations and support documentation artifacts for the Aceli LAT program."),
        docIndexTable(opsSupportRows),

        // ── 6. Release Documentation ──
        heading("6. Release Documentation"),
        body("The following table lists all release documentation artifacts for the Aceli LAT program."),
        docIndexTable(releaseRows),

        // ── 7. Documentation Standards ──
        heading("7. Documentation Standards"),
        body("All documentation must comply with the following standards:"),
        bulletItem("Documentation-first rule: no feature build starts without linked requirement IDs."),
        bulletItem("Traceability rule: every document maps to SRS/FRS/user story IDs."),
        bulletItem("No hallucination rule: if a platform detail is unknown, create an assumption record."),
        bulletItem("Audit rule: all meaningful actions generate structured logs that are documented."),
        bulletItem("Definition-of-done rule: documentation is required for every increment."),
        body("Documents must use the standardized template structure defined by the Technical Writer Agent, include version history, and be stored in the approved repository structure."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/sprint0/Aceli_LAT_Documentation_Index.docx", buf);
  console.log("Documentation Index generated successfully.");
});
