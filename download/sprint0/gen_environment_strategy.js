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
  title: "Aceli LAT Environment Strategy",
  subtitle: "Environment Topology, Promotion Pathways, and Data Governance",
  englishLabel: "ENVIRONMENT STRATEGY",
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

// ── Table border preset ──
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
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aceli LAT Environment Strategy", size: 18, color: "808080" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })] })] }) },
      children: [
        // ── 1. Environment Strategy Purpose ──
        heading("1. Environment Strategy Purpose"),
        body("This document defines the environment strategy for the Aceli LAT production build. It establishes the environments, their purposes, promotion pathways, access controls, data handling rules, and operational responsibilities. The strategy ensures that every stage of the delivery pipeline operates in a controlled, reproducible, and auditable manner, consistent with the RFP requirements for data governance, tenant security, and production safety."),

        // ── 2. Environment Topology ──
        heading("2. Environment Topology"),
        body("The environment topology comprises five distinct environments, each serving a specific purpose in the delivery pipeline."),

        // ── Environment Topology Table ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Environment", 15),
                headerCell("Purpose", 25),
                headerCell("Data Classification", 22),
                headerCell("Access Level", 18),
                headerCell("Managed By", 20),
              ],
            }),
            new TableRow({ cantSplit: true, children: [
              dataCell("Local/Dev", 15),
              dataCell("Individual agent development and unit testing", 25),
              dataCell("Synthetic data only", 22),
              dataCell("Developer role", 18),
              dataCell("DevSecOps Agent", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Test", 15),
              dataCell("Integration testing and contract validation", 25),
              dataCell("Synthetic data with controlled test fixtures", 22),
              dataCell("QA and development roles", 18),
              dataCell("DevSecOps Agent", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("UAT", 15),
              dataCell("User acceptance testing and business validation", 25),
              dataCell("Anonymized production-like data", 22),
              dataCell("Business users and QA", 18),
              dataCell("DevSecOps Agent", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Staging", 15),
              dataCell("Pre-production validation and performance testing", 25),
              dataCell("Production mirror data (anonymized)", 22),
              dataCell("Release manager and QA", 18),
              dataCell("DevSecOps Agent", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Production", 15),
              dataCell("Live operational environment", 25),
              dataCell("Real production data", 22),
              dataCell("Authorized users per RBAC", 18),
              dataCell("DevSecOps Agent with Aceli operations", 20),
            ]}),
          ],
        }),

        // ── 3. Promotion Pathway ──
        heading("3. Promotion Pathway"),
        body("Code and configuration promote through environments in a strict linear pathway:"),
        bulletItem("Local/Dev to Test: automated CI pipeline triggers on merge to develop branch; requires passing unit tests and static analysis"),
        bulletItem("Test to UAT: automated promotion on successful integration test suite completion; requires QA agent sign-off"),
        bulletItem("UAT to Staging: manual promotion by Release Manager after UAT sign-off; requires UAT evidence pack"),
        bulletItem("Staging to Production: manual promotion by Release Manager after pilot go-live checklist or country rollout readiness sign-off; requires signed release checklist and rollback plan"),
        body("No promotion may skip an environment. Rollback follows the reverse pathway with documented rationale."),

        // ── 4. Data Handling per Environment ──
        heading("4. Data Handling per Environment"),
        body("Data handling rules are strict and non-negotiable. Local/Dev and Test environments must use only synthetic data generated by approved test data factories. No production data, anonymized or otherwise, may be present in these environments. UAT environments may use anonymized production-like data that has been processed through an approved data masking pipeline. Staging environments may use production mirror data that has been anonymized, with the masking process validated by the Red Team/Compliance Agent. Production environments contain real data and are subject to all data governance constraints including the prohibition on using lender-level or borrower-level data for model training."),

        // ── Data Handling Table ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Environment", 20),
                headerCell("Data Type Permitted", 40),
                headerCell("Restrictions", 40),
              ],
            }),
            new TableRow({ cantSplit: true, children: [
              dataCell("Local/Dev", 20),
              dataCell("Synthetic data from approved test data factories", 40),
              dataCell("No production data of any kind", 40),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Test", 20),
              dataCell("Synthetic data with controlled test fixtures", 40),
              dataCell("No production data of any kind", 40),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("UAT", 20),
              dataCell("Anonymized production-like data via approved masking pipeline", 40),
              dataCell("Must be processed through approved data masking pipeline", 40),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Staging", 20),
              dataCell("Production mirror data (anonymized)", 40),
              dataCell("Masking process validated by Red Team/Compliance Agent", 40),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Production", 20),
              dataCell("Real production data", 40),
              dataCell("Full data governance constraints apply; no lender/borrower-level data for model training", 40),
            ]}),
          ],
        }),

        // ── 5. Secret and Configuration Management ──
        heading("5. Secret and Configuration Management"),
        body("Secrets, tokens, credentials, and tenant settings must never be hardcoded. All secrets are managed through an approved secrets management solution with environment-specific vaults. Configuration is externalized and environment-driven, with no production credentials in non-production configuration files. Secret rotation follows a defined schedule, and access to production secrets requires explicit authorization from the Delivery Orchestrator and Aceli security. The DevSecOps Agent is responsible for maintaining the secrets management infrastructure and auditing access logs."),

        // ── 6. Access Control and RBAC per Environment ──
        heading("6. Access Control and RBAC per Environment"),
        body("Access to each environment is governed by role-based access control aligned to the principle of least privilege."),

        // ── RBAC Table ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Role", 20),
                headerCell("Local/Dev", 16),
                headerCell("Test", 16),
                headerCell("UAT", 16),
                headerCell("Staging", 16),
                headerCell("Production", 16),
              ],
            }),
            new TableRow({ cantSplit: true, children: [
              dataCell("Developer", 20),
              dataCell("Write", 16),
              dataCell("Read", 16),
              dataCell("None", 16),
              dataCell("None", 16),
              dataCell("None", 16),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("QA Agent", 20),
              dataCell("Read", 16),
              dataCell("Write", 16),
              dataCell("Write", 16),
              dataCell("None", 16),
              dataCell("None", 16),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Business User", 20),
              dataCell("None", 16),
              dataCell("None", 16),
              dataCell("Write", 16),
              dataCell("None", 16),
              dataCell("None", 16),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Release Manager", 20),
              dataCell("None", 16),
              dataCell("None", 16),
              dataCell("None", 16),
              dataCell("Write + Promote", 16),
              dataCell("None", 16),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("DevSecOps Agent", 20),
              dataCell("Maintain", 16),
              dataCell("Maintain", 16),
              dataCell("Maintain", 16),
              dataCell("Maintain", 16),
              dataCell("Maintain", 16),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Aceli Operations", 20),
              dataCell("None", 16),
              dataCell("None", 16),
              dataCell("None", 16),
              dataCell("None", 16),
              dataCell("Authorized access", 16),
            ]}),
          ],
        }),
        body("No agent or human may access production data without explicit authorization and logged access."),

        // ── 7. CI/CD Pipeline Architecture ──
        heading("7. CI/CD Pipeline Architecture"),
        body("The CI/CD pipeline enforces the promotion pathway through automated gates. Every merge to the develop branch triggers: linting, static analysis, unit test execution, and build artifact creation. Successful completion promotes to the Test environment automatically. Integration test completion and QA sign-off triggers promotion to UAT. UAT sign-off enables manual promotion to Staging. Release checklist sign-off enables manual promotion to Production. Rollback is automated from Staging to UAT and from Production to Staging, with documented rationale required."),

        // ── CI/CD Pipeline Table ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Pipeline Stage", 20),
                headerCell("Trigger", 25),
                headerCell("Gate Requirements", 30),
                headerCell("Promotion Type", 25),
              ],
            }),
            new TableRow({ cantSplit: true, children: [
              dataCell("Build", 20),
              dataCell("Merge to develop branch", 25),
              dataCell("Linting, static analysis, unit tests, build artifact creation", 30),
              dataCell("Automated to Test", 25),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Integration", 20),
              dataCell("Successful build completion", 25),
              dataCell("Integration test suite completion, QA agent sign-off", 30),
              dataCell("Automated to UAT", 25),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("UAT Validation", 20),
              dataCell("UAT sign-off", 25),
              dataCell("UAT evidence pack submitted", 30),
              dataCell("Manual to Staging", 25),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Release", 20),
              dataCell("Release checklist sign-off", 25),
              dataCell("Signed release checklist and rollback plan", 30),
              dataCell("Manual to Production", 25),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Rollback", 20),
              dataCell("Issue detected post-promotion", 25),
              dataCell("Documented rationale required", 30),
              dataCell("Automated reverse", 25),
            ]}),
          ],
        }),

        // ── 8. Environment Provisioning and Decommissioning ──
        heading("8. Environment Provisioning and Decommissioning"),
        body("Environments are provisioned using infrastructure-as-code templates maintained by the DevSecOps Agent. No manual environment setup is permitted. Environment provisioning includes:"),
        bulletItem("Compute and storage resources"),
        bulletItem("Network configuration and firewall rules"),
        bulletItem("Monitoring and logging agents"),
        bulletItem("Security baseline configuration"),
        body("Decommissioning follows an approved process with data wipe verification, resource release, and audit log preservation."),

        // ── Provisioning Checklist Table ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Provisioning Step", 30),
                headerCell("Description", 40),
                headerCell("Responsible", 30),
              ],
            }),
            new TableRow({ cantSplit: true, children: [
              dataCell("Compute and Storage", 30),
              dataCell("Provision required compute instances and storage volumes", 40),
              dataCell("DevSecOps Agent", 30),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Network Configuration", 30),
              dataCell("Configure VPC, subnets, firewall rules, and access controls", 40),
              dataCell("DevSecOps Agent", 30),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Monitoring and Logging", 30),
              dataCell("Deploy monitoring agents, log collectors, and alerting rules", 40),
              dataCell("DevSecOps Agent", 30),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Security Baseline", 30),
              dataCell("Apply security hardening, patch baseline, and compliance checks", 40),
              dataCell("DevSecOps Agent", 30),
            ]}),
            new TableRow({ cantSplit: true, children: [
              dataCell("Decommissioning", 30),
              dataCell("Data wipe verification, resource release, and audit log preservation", 40),
              dataCell("DevSecOps Agent", 30),
            ]}),
          ],
        }),
      ],
    },
  ],
});

// ── Write file ──
const outPath = "/home/z/my-project/download/sprint0/Aceli_LAT_Environment_Strategy.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("Environment Strategy generated successfully at:", outPath);
});
