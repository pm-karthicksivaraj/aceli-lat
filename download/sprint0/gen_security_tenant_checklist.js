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

function makeTable(headerRow, dataRows) {
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
      new TableRow({ tableHeader: true, children: headerRow }),
      ...dataRows.map(row => new TableRow({ cantSplit: true, children: row })),
    ],
  });
}

// ── Page setup ──
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

// ── Cover config ──
const coverConfig = {
  title: "Aceli LAT Security and Tenant Approval Checklist",
  subtitle: "Security Review and Tenant Approval Process for Production Build Components",
  englishLabel: "SECURITY CHECKLIST",
  metaLines: [
    "Project: Aceli Africa LAT Platform",
    "Version: 1.1 \u2014 Updated",
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
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aceli LAT Security and Tenant Approval Checklist", size: 18, color: "808080" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })] })] }) },
      children: [
        // ── 1. Checklist Purpose ──
        heading("1. Checklist Purpose"),
        body("This checklist governs the security review and tenant approval process for all platforms, services, and tools used in the Aceli LAT production build. Per the RFP, any additional application runtime, middleware, storage, queue, mobile/web framework, observability stack, transcription component, or integration platform must pass Aceli information security review and be added to the approved list before contract execution if vendor-provided. This checklist ensures that no unapproved component enters the production build pipeline. This updated version incorporates clarifications received from the Aceli consortium regarding confirmed platforms, licensing structures, and operating conditions."),

        // ── 2. Mandatory Enterprise Platforms (Pre-Approved) ──
        heading("2. Mandatory Enterprise Platforms (Pre-Approved)"),
        body("The following enterprise platforms are pre-approved for use in the Aceli LAT production build, subject to the conditions specified below. Each platform must operate within its designated Aceli-approved tenant and must not exceed its approved scope."),

        makeTable(
          [headerCell("Platform", 20), headerCell("Purpose", 30), headerCell("Approval Status", 15), headerCell("Conditions", 35)],
          [
            [dataCell("Salesforce Enterprise Edition", 20), dataCell("System of record for lender relationship data with custom objects; API integration target", 30), dataCell("Pre-Approved", 15), dataCell("Must operate within Aceli Salesforce tenant; Aceli internal Salesforce team supports configuration, integration, workflow, and data model enhancements collaboratively; Salesforce sandbox available for development and testing", 35)],
            [dataCell("Power BI", 20), dataCell("Reporting, analytics, visualization layer; reads from Salesforce via standard connector alongside controlled data sources", 30), dataCell("Pre-Approved", 15), dataCell("Must not become operational system of record or data capture tool; existing benchmarking dataset of ~60K records connected via Google Sheets sources must flow through controlled pathways", 35)],
            [dataCell("Google Workspace", 20), dataCell("Collaboration, document operations where applicable", 30), dataCell("Pre-Approved", 15), dataCell("Must operate within Aceli-approved enterprise tenant; current LAT tooling resides in Google Sheets and will be migrated to the governed platform", 35)],
            [dataCell("Claude Team / Enterprise via Claude for Nonprofits", 20), dataCell("Governed AI processing for transcription, extraction, summarization, and prompt orchestration", 30), dataCell("Pre-Approved", 15), dataCell("Must operate within Aceli-approved enterprise tenant; production LLM processing involving sensitive programme data must occur within approved enterprise environments; no data used for model training or fine-tuning; ongoing platform licensing costs managed separately from the capped implementation budget; Aceli operates within the Claude for Nonprofits programme", 35)],
          ]
        ),

        // ── 3. Components Requiring Security Review ──
        heading("3. Components Requiring Security Review"),
        body("All components not listed in Section 2 as pre-approved must undergo a formal security review before being introduced into the production build. The table below identifies each component category, provides examples, and specifies the review authority and approval timeline."),

        makeTable(
          [headerCell("Component Category", 18), headerCell("Examples", 22), headerCell("Review Required", 12), headerCell("Review Authority", 28), headerCell("Approval Timeline", 20)],
          [
            [dataCell("Application Runtime", 18), dataCell("Node.js, Python, Java", 22), dataCell("Yes", 12), dataCell("DevSecOps + Red Team", 28), dataCell("Sprint 0-1", 20)],
            [dataCell("Database/Storage", 18), dataCell("PostgreSQL, Redis, S3-equivalent", 22), dataCell("Yes", 12), dataCell("DevSecOps + Red Team", 28), dataCell("Sprint 0-1", 20)],
            [dataCell("Message Queue", 18), dataCell("Kafka, RabbitMQ, SQS-equivalent", 22), dataCell("Yes", 12), dataCell("DevSecOps + Red Team", 28), dataCell("Sprint 0-1", 20)],
            [dataCell("Mobile/Web Framework", 18), dataCell("Next.js, React, PWA tooling", 22), dataCell("Yes", 12), dataCell("DevSecOps + Red Team", 28), dataCell("Sprint 0-1", 20)],
            [dataCell("Observability Stack", 18), dataCell("Logging, monitoring, tracing tools", 22), dataCell("Yes", 12), dataCell("DevSecOps + Red Team", 28), dataCell("Sprint 0-1", 20)],
            [dataCell("Transcription Service", 18), dataCell("Speech-to-text with regional accent and limited multilingual support", 22), dataCell("Yes", 12), dataCell("DevSecOps + Red Team + Architect", 28), dataCell("Sprint 0-1", 20)],
            [dataCell("Integration Platform", 18), dataCell("API gateway, ESB", 22), dataCell("Yes", 12), dataCell("DevSecOps + Red Team", 28), dataCell("Sprint 0-1", 20)],
            [dataCell("Identity Provider", 18), dataCell("SSO, OAuth, MFA", 22), dataCell("Yes", 12), dataCell("DevSecOps + Red Team", 28), dataCell("Sprint 0-1", 20)],
          ]
        ),

        // ── 4. Security Review Criteria ──
        heading("4. Security Review Criteria"),
        body("Each component must be evaluated against the following criteria. A component fails review if it does not satisfy all applicable criteria, or if any criterion is rated as unacceptable risk without a documented mitigation plan."),

        heading("4.1 Data Residency Compliance", HeadingLevel.HEADING_2),
        body("Does the component process or store data in approved jurisdictions? Does it comply with Aceli data residency requirements?"),

        heading("4.2 Tenant Isolation", HeadingLevel.HEADING_2),
        body("Does the component operate within an Aceli-approved enterprise tenant? Is there risk of cross-tenant data exposure?"),

        heading("4.3 Training Data Exclusion", HeadingLevel.HEADING_2),
        body("Does the component use input data for model training or fine-tuning? Can training be explicitly opted out? This is especially critical for AI transcription services that process field conversations containing lender-sensitive information."),

        heading("4.4 Audit and Logging Capability", HeadingLevel.HEADING_2),
        body("Does the component produce audit logs? Are logs exportable and immutable?"),

        heading("4.5 Access Control", HeadingLevel.HEADING_2),
        body("Does the component support role-based access control? Can access be restricted to authorized personnel?"),

        heading("4.6 Encryption", HeadingLevel.HEADING_2),
        body("Does the component encrypt data at rest and in transit? What encryption standards are used?"),

        heading("4.7 Vulnerability Management", HeadingLevel.HEADING_2),
        body("Does the vendor provide timely security patches? What is the disclosure and remediation process?"),

        heading("4.8 Business Continuity", HeadingLevel.HEADING_2),
        body("What is the vendor SLA for availability? Is there a disaster recovery plan?"),

        heading("4.9 Budget Separation", HeadingLevel.HEADING_2),
        body("Are ongoing licensing costs clearly identified and separable from the implementation budget? Per Aceli consortium clarification, platform licensing costs are managed separately from the capped implementation budget."),

        // ── 5. Tenant Approval Process ──
        heading("5. Tenant Approval Process"),
        body("The following seven-step process governs the approval of all components for use in the Aceli LAT production build. No component may enter the production pipeline without completing this process."),

        heading("5.1 Step 1: Component Identification", HeadingLevel.HEADING_2),
        body("Requesting agent identifies the component, version, and intended use; includes identification of any licensing costs separate from implementation budget."),

        heading("5.2 Step 2: Security Review Submission", HeadingLevel.HEADING_2),
        body("DevSecOps Agent completes the security review checklist for the component; includes budget impact classification."),

        heading("5.3 Step 3: Red Team Assessment", HeadingLevel.HEADING_2),
        body("Red Team/Compliance Agent conducts independent security assessment; includes data governance review for AI components processing sensitive programme data."),

        heading("5.4 Step 4: Architecture Review", HeadingLevel.HEADING_2),
        body("Solution Architect evaluates integration impact and compatibility; includes Aceli Salesforce team collaboration for Salesforce-related components."),

        heading("5.5 Step 5: Approval Decision", HeadingLevel.HEADING_2),
        body("DevSecOps + Red Team + Architect jointly approve or reject; rejection requires rationale and alternative recommendation; budget implications documented for Aceli review."),

        heading("5.6 Step 6: Approved List Update", HeadingLevel.HEADING_2),
        body("Approved component is added to the approved list with version, conditions, review date, and licensing cost classification."),

        heading("5.7 Step 7: Ongoing Monitoring", HeadingLevel.HEADING_2),
        body("Approved components are reviewed at phase transitions and on vulnerability disclosure; licensing costs reviewed at phase gates."),

        // ── 6. Prohibited Components and Patterns ──
        heading("6. Prohibited Components and Patterns"),
        body("The following are explicitly prohibited without exception. No approval process exists for these items; they must never be introduced into the production build pipeline under any circumstances."),

        bulletItem("Direct production dependency on unapproved public LLM endpoints"),
        bulletItem("Local shadow databases acting as source of truth"),
        bulletItem("Spreadsheet export-based reconciliation workflows"),
        bulletItem("Unreviewed schema mutations in Salesforce"),
        bulletItem("Dashboards used as transactional capture tools"),
        bulletItem("AI auto-writeback bypassing reviewer approval"),
        bulletItem("Hardcoded secrets, tokens, or credentials"),
        bulletItem("Unapproved third-party analytics or tracking services"),
        bulletItem("Any component that uses Aceli lender-level or borrower-level data for model training or fine-tuning regardless of the vendor or platform"),

        // ── 7. Compliance Validation Schedule ──
        heading("7. Compliance Validation Schedule"),
        body("Compliance validation occurs at the following points in the delivery lifecycle. Each validation point ensures that the approved component list remains current and that no unapproved components have entered the production pipeline."),

        makeTable(
          [headerCell("Validation Point", 18), headerCell("Scope", 50), headerCell("Output", 32)],
          [
            [dataCell("Sprint 0", 18), dataCell("Initial approved list published; all mandatory platforms confirmed including Claude for Nonprofits; Salesforce Enterprise Edition and sandbox availability confirmed", 50), dataCell("Approved component register", 32)],
            [dataCell("Sprint Boundary", 18), dataCell("New component additions reviewed and approved before use; licensing cost implications assessed", 50), dataCell("Updated approved list with new entries", 32)],
            [dataCell("Phase Gates", 18), dataCell("Full compliance review of all approved components; vulnerability assessment; licensing cost review", 50), dataCell("Phase gate compliance report", 32)],
            [dataCell("Ad-hoc", 18), dataCell("Immediate review triggered by security incident or vulnerability disclosure", 50), dataCell("Incident review and remediation report", 32)],
          ]
        ),

        // ── 8. Consortium Clarification Impacts ──
        heading("8. Consortium Clarification Impacts"),
        body("This section documents the specific impacts of the Aceli consortium clarifications on the security and tenant approval process. Each clarification has been evaluated for its effect on the checklist requirements and operational procedures."),

        heading("8.1 Claude for Nonprofits Confirmation (Consortium Clarification 7)", HeadingLevel.HEADING_2),
        body("Claude Team/Enterprise is confirmed as the pre-approved AI platform; licensing costs are separate from implementation budget; production LLM processing must occur in approved enterprise environments."),

        heading("8.2 Salesforce Enterprise Edition Details (Consortium Clarification 2)", HeadingLevel.HEADING_2),
        body("Custom objects confirmed; Aceli internal Salesforce team collaboration required; sandbox available for development and testing; LAT scoring framework not currently in Salesforce."),

        heading("8.3 Transcription Requirements (Consortium Clarification 5)", HeadingLevel.HEADING_2),
        body("Regional accent support and limited multilingual code-switching required; transcription service security review must cover data handling for conversations containing Swahili and local-language phrases."),

        heading("8.4 Benchmarking Dataset (Consortium Clarification 4)", HeadingLevel.HEADING_2),
        body("Approximately 60,000 records in Google Sheets connected to Power BI; data pathway must be controlled and auditable; no rebuild of existing architecture."),
      ],
    },
  ],
});

// ── Write file ──
const outPath = "/home/z/my-project/download/sprint0/Aceli_LAT_Security_Tenant_Approval_Checklist.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("Security Tenant Approval Checklist (UPDATED) generated successfully at:", outPath);
});
