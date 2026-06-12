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

function bodyNoIndent(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
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

const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

const coverConfig = {
  title: "Aceli LAT Vision Brief",
  subtitle: "AI-Enabled Lender Activation Tool for Africa",
  englishLabel: "VISION BRIEF",
  metaLines: [
    "Project: Aceli Africa LAT Platform",
    "Version: 1.1 — Updated with Consortium Feedback",
    "Date: 2026-03-05",
    "Classification: Confidential",
  ],
  footerLeft: "Aceli Africa",
  footerRight: "Sprint 0 Deliverable",
  palette: P.cover,
};

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
      { reference: "num-list-1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    // ── Section 1: Cover ──
    {
      properties: { page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR1(coverConfig),
    },
    // ── Section 2: TOC ──
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
    // ── Section 3: Body ──
    {
      properties: { type: SectionType.NEXT_PAGE, page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aceli LAT Vision Brief", size: 18, color: "808080" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })] })] }) },
      children: [
        // ── 1. Executive Summary ──
        heading("1. Executive Summary"),
        body("The Aceli Lender Activation Tool (LAT) is an AI-enabled platform designed to transform how Aceli Africa manages lender relationship intelligence across its five-country operational footprint covering approximately 55 lending institutions. The LAT platform replaces a fragmented Google Sheets-based process with a governed, field-ready application that integrates AI-powered transcription and extraction, human-in-the-loop review, controlled Salesforce write-back, and structured benchmarking feeds. This vision brief establishes the strategic rationale, core objectives, and guiding principles for the LAT production build, incorporating clarifications received from the Aceli consortium following the initial RFP review."),
        body("The platform is explicitly production-first, not MVP-first. Every sprint must produce working software, controlled documentation, test evidence, and operational artifacts. The build is designed for execution by a multi-agent engineering organization and follows a ten-sprint plan across four phases: discovery and design (Phase 0), pilot build and deployment (Phase 1), phased multi-country rollout (Phase 2), and post-rollout warranty and continuous improvement (Phase 3)."),

        // ── 2. Problem Statement ──
        heading("2. Problem Statement"),
        body("Aceli Africa currently relies on Google Sheets as the primary tool for capturing, tracking, and reconciling lender activation data across five countries and approximately 55 lending institutions. These institutions include commercial banks, local non-bank financial institutions (NBFIs), SACCOs, and global social lenders, serving a diverse range of agricultural borrowers and financing structures. Loan sizes range from approximately US$10,000 to US$1.5 million, with a significant concentration in smaller-ticket SME lending. This institutional diversity means the platform must be flexible enough to accommodate different lender operating models, borrower structures, and country-specific engagement approaches."),
        body("The current Google Sheets-based LAT tool contains the lender activation methodology and scoring framework, assessment questions and scoring approaches across the six activation areas, and country-level lender activation assessments linked to Salesforce reporting outputs. However, this approach introduces significant operational risks and productivity losses that undermine the organization\u2019s mission of strengthening agricultural lending in sub-Saharan Africa."),
        body("Field staff, including Country Directors and Country Managers, currently spend substantial time on manual data entry, reconciliation, and status tracking. There is no structured workflow for capturing qualitative intelligence from lender meetings, no AI-assisted extraction of key updates from voice or text notes, and no governed pathway for updating lender records in Salesforce. The LAT scoring framework itself remains primarily managed through Google Sheets workflows rather than fully embedded within Salesforce, despite Salesforce Enterprise Edition being the system of record with custom objects for lender relationship management. Reconciliation between spreadsheets and the system of record is error-prone, time-consuming, and lacks audit trails."),
        body("The absence of offline-capable tools means field staff in low-bandwidth environments cannot reliably capture meeting outcomes. While country teams generally operate in environments with intermittent or variable mobile connectivity rather than prolonged periods of complete offline operation, the platform must still support resilient low-bandwidth usage and offline capture where appropriate, particularly during field engagement and travel between lender locations. Without structured review and approval workflows, data quality cannot be assured before updates reach Salesforce. Power BI dashboards are sometimes used for ad-hoc data capture, blurring the line between analytics and operational systems and creating shadow data stores that violate data governance principles."),

        // ── 3. Vision Statement ──
        heading("3. Vision Statement"),
        body("The LAT platform will serve as the field-facing workflow and intelligence layer that empowers Aceli\u2019s country teams to capture, structure, review, and act on lender relationship intelligence with speed, accuracy, and full auditability. It will integrate seamlessly with Salesforce Enterprise Edition as the system of record, feed controlled data to benchmarking and analytics systems, and ensure that every AI-generated insight passes through human review before affecting official records."),
        body("The vision is anchored in three pillars: intelligent capture, governed workflow, and operational resilience. Intelligent capture means field staff can record voice memos or type notes that are automatically transcribed and structured into the six activation areas, with transcription and extraction workflows that accommodate regional accents, agricultural terminology, and limited multilingual code-switching including occasional Swahili and local-language phrases. Governed workflow means every AI-suggested update is reviewed, approved, and logged before write-back. Operational resilience means the platform works reliably in low-bandwidth environments with intermittent connectivity, supports offline capture where appropriate during field engagement, and meets 99.5% availability targets during business hours."),

        // ── 4. Strategic Objectives ──
        heading("4. Strategic Objectives"),
        heading("4.1 Reconciliation Time Reduction", HeadingLevel.HEADING_2),
        body("The platform must deliver a measurable reduction of at least 60% in the time required to reconcile lender activation data compared to the current Google Sheets-based baseline. Importantly, Aceli does not currently maintain a formalized measurement of reconciliation time for the Lender Activation Working Group. The baseline will therefore need to be established during discovery through workflow observation, stakeholder interviews, and practical measurement approaches. The baseline methodology and resulting benchmark values will be jointly agreed between Aceli and the vendor during discovery before being used for pilot performance assessment. This collaborative approach ensures the baseline is credible, representative, and accepted by both parties."),
        heading("4.2 Activation Gap Visibility", HeadingLevel.HEADING_2),
        body("The platform must provide real-time visibility into lender activation gaps across all five countries and approximately 55 lending institutions. Country Directors, Country Managers, and HQ staff must be able to see which lenders have outstanding actions, incomplete activation areas, or pending review decisions. This visibility must be structured, role-filtered, and traceable to reviewed source data, not assembled through manual spreadsheet exports."),
        heading("4.3 Field Productivity and Adoption", HeadingLevel.HEADING_2),
        body("The platform must demonstrate monthly active use by field staff across all five countries following rollout. Adoption is not optional; it is a contractual success criterion. The platform must be designed for environments with intermittent or variable mobile connectivity, support offline capture where appropriate during field engagement and travel between lender locations, and provide a mobile-first user experience that reduces rather than increases the administrative burden on field teams."),
        heading("4.4 Governed AI-Assisted Updates", HeadingLevel.HEADING_2),
        body("All AI-suggested lender updates must pass through a structured human review process before any data is written back to Salesforce or other approved systems. There must be no auto-commit of AI-generated fields, no bypass of the review workflow, and no shadow databases. Every AI decision, reviewer action, and data update must produce an immutable audit log that is exportable and review-ready. The AI transcription and extraction workflows must accommodate the practical realities of field conversations, including regional accents, agricultural terminology, and limited multilingual code-switching where occasional Swahili and local-language phrases may occur alongside primarily English conversations."),
        heading("4.5 Multi-Country Operational Readiness", HeadingLevel.HEADING_2),
        body("The platform must be fully operational across all five Aceli countries by the end of Phase 2, with bidirectional Salesforce synchronization verified, country-specific configurations applied, training completed, and weekly active use instrumented and measurable. The pilot country will be jointly agreed during Phase 0 discovery, considering factors such as operational readiness, stakeholder availability, lender concentration, implementation practicality, and overall delivery risk within the 90-day pilot window. Rollout readiness for each country requires explicit sign-off against a country readiness checklist."),
        heading("4.6 Flexible Lender Model Support", HeadingLevel.HEADING_2),
        body("The platform must accommodate the diversity of Aceli\u2019s lending institution portfolio, which spans commercial banks, local non-bank financial institutions, SACCOs, and global social lenders. These institutions serve diverse borrower types including agricultural SMEs, cooperatives, producer organizations, SACCO-linked borrowers, traders, processors, and other agricultural enterprises across multiple value chains. Loan sizes range from approximately US$10,000 to US$1.5 million with significant concentration in smaller-ticket SME lending. The platform\u2019s data model, activation assessment workflows, and reporting capabilities must be flexible enough to support this institutional diversity without requiring country-specific or lender-type-specific customizations that compromise maintainability."),

        // ── 5. Scope Boundaries ──
        heading("5. Scope Boundaries"),
        heading("5.1 In Scope", HeadingLevel.HEADING_2),
        bulletItem("Mobile-first responsive web application (PWA) for field capture and review"),
        bulletItem("AI-powered transcription and extraction with regional accent, agricultural terminology, and limited multilingual accommodation"),
        bulletItem("Structured mapping to six activation areas per the existing LAT methodology"),
        bulletItem("Human-in-the-loop review workbench with edit, approve, reject, and follow-up states"),
        bulletItem("Controlled Salesforce write-back to custom objects with pre-commit validation and audit logging"),
        bulletItem("Offline-capable architecture for intermittent connectivity with local persistence and synchronization"),
        bulletItem("Controlled benchmarking data feed pathway (~60,000 records from existing Google Sheets/Power BI environment)"),
        bulletItem("HQ dashboards, intervention priority views, and scorecard support"),
        bulletItem("RBAC aligned to country, HQ, executive, and product owner roles"),
        bulletItem("Data migration from current Google Sheets LAT process"),
        bulletItem("Collaborative baseline measurement methodology development"),
        bulletItem("Training, change management, admin handover, and warranty support"),

        heading("5.2 Out of Scope", HeadingLevel.HEADING_2),
        bulletItem("Replacement or modification of Salesforce as the system of record"),
        bulletItem("Replacement of Power BI as the analytics and reporting layer"),
        bulletItem("Rebuilding the existing benchmarking architecture or dataset"),
        bulletItem("Training of vendor-owned, shared, or third-party models on Aceli data"),
        bulletItem("Auto-commit of AI-generated updates without human review"),
        bulletItem("Unmanaged exports, shadow databases, or manual reconciliation routines"),

        // ── 6. Guiding Principles ──
        heading("6. Guiding Principles"),
        body("The following principles are non-negotiable and derive directly from the RFP and consortium clarifications. Every design decision, code contribution, and documentation artifact must be consistent with these constraints."),
        bulletItem("Salesforce as source of truth: The LAT platform is the field-facing workflow and intelligence layer. Salesforce Enterprise Edition with its custom objects remains the system of record. The LAT scoring framework will be migrated from Google Sheets into the governed platform."),
        bulletItem("Power BI as analytics layer: Power BI remains the analytics and reporting layer, reading from Salesforce via the standard connector alongside controlled data sources. It must not become the operational system of record or a data capture tool."),
        bulletItem("Controlled benchmarking: The existing benchmarking dataset of approximately 60,000 records is not being rebuilt. LAT outputs must flow into the approved analytics environment through controlled, governed, and auditable pathways without introducing unmanaged exports, shadow databases, or manual reconciliation routines."),
        bulletItem("Human-in-the-loop for all AI outputs: All AI-suggested updates require human review before write-back. No auto-commit, no bypass, no exceptions."),
        bulletItem("Audit-ready logging: All AI-assisted decisions and outputs must produce structured, immutable, exportable audit logs."),
        bulletItem("No data for model training: No lender-level or borrower-level data may be used to train vendor-owned, shared, or third-party models."),
        bulletItem("Approved tenants only: All processing must run within Aceli-approved enterprise tenants. Aceli operates within the Claude for Nonprofits programme with access to Claude Team/Enterprise environments. Production LLM processing involving sensitive programme data must occur within approved enterprise environments. Ongoing platform licensing costs are managed separately from the capped implementation budget."),
        bulletItem("Offline-resilient: The solution must support low-bandwidth operation and offline capture where appropriate during field engagement, accommodating intermittent rather than prolonged offline conditions."),
        bulletItem("99.5% availability: The solution must target 99.5% availability during business hours."),
        bulletItem("Documentation as a first-class output: Documentation, testing, release evidence, and admin handover are equal to application code in importance."),
        bulletItem("Collaborative methodology: Baseline measurement, pilot country selection, and key design decisions will be jointly agreed with Aceli during discovery, not assumed or imposed."),
        bulletItem("Flexibility across lender types: The platform must accommodate diverse lending institution types, borrower structures, and country-specific approaches without compromising maintainability."),

        // ── 7. Success Criteria ──
        heading("7. Success Criteria"),
        body("The program is successful only if the following criteria are met, as measured by objective evidence gathered during pilot and rollout phases:"),
        bulletItem("Pilot country jointly agreed during Phase 0 and pilot environment operational by Day 90 with priority lenders loaded and end-to-end workflow functional."),
        bulletItem("Baseline reconciliation measurement methodology collaboratively established and agreed during discovery, with at least 60% reduction evidenced through structured baseline-to-pilot comparison."),
        bulletItem("Monthly active use demonstrated by field staff in the pilot country."),
        bulletItem("Weekly active use evidenced across all five countries following full rollout."),
        bulletItem("Bidirectional Salesforce synchronization with custom objects operational and verified."),
        bulletItem("All AI-generated updates pass through human review with no auto-commit incidents."),
        bulletItem("AI transcription accommodates regional accents, agricultural terminology, and limited code-switching with acceptable accuracy."),
        bulletItem("Audit logs are complete, immutable, and exportable for all user and AI actions."),
        bulletItem("No shadow databases, unmanaged exports, or manual reconciliation routines exist."),
        bulletItem("Admin handover completed with accepted documentation and trained administrators."),
        bulletItem("Warranty obligations met with defects resolved within SLA."),

        // ── 8. Stakeholder Alignment ──
        heading("8. Stakeholder Alignment"),
        body("The LAT platform serves multiple stakeholder groups with distinct needs and access patterns. Country Directors and Country Managers require field-ready tools for meeting capture and lender status review. The LAT Working Group needs structured review and approval workflows. HQ staff require aggregated visibility into activation progress, intervention priorities, and scorecard traceability. Executive stakeholders require evidence of KPI movement, operational governance, and audit readiness."),
        body("Per the consortium feedback, core stakeholder interviews during discovery will include Product Design, Product Operations, Country Leads, MEL (Monitoring, Evaluation, and Learning), and Executive Office staff. External stakeholder interviews are not mandatory but are encouraged where they would materially strengthen the quality of the opportunity scan, prioritization process, or resulting implementation recommendations. The platform\u2019s RBAC model, UX design, and reporting capabilities must address each group\u2019s requirements without creating role conflicts or data access violations."),
        body("Stakeholder alignment will be validated through the current-state process mapping in Sprint 1, the user persona pack, and the user story catalogue. The BRD and PRD produced in Sprint 1 will document stakeholder needs with explicit sign-off gates. Aceli\u2019s internal Salesforce team will collaborate on configuration, integration, workflow, and data model enhancements. Any gaps or open questions will be recorded as assumption records per the no-hallucination rule and resolved before the Week 4 design sign-off."),

        // ── 9. Key Risks and Constraints ──
        heading("9. Key Risks and Constraints"),
        body("Several risks and constraints must be actively managed throughout the program. Connectivity challenges in field environments require robust architecture for intermittent connectivity with reliable synchronization and conflict resolution, noting that the operating condition is primarily intermittent/variable connectivity rather than prolonged offline operation. Salesforce Enterprise Edition customization requires careful integration design with Aceli\u2019s internal Salesforce team, including coordination on custom objects and any required configuration, integration, workflow, or data model enhancements. A Salesforce sandbox is available for development and testing."),
        body("AI transcription accuracy must be tested for regional English accents, agricultural terminology, and limited multilingual code-switching including Swahili and local-language phrases. The primarily English conversation context with occasional code-switching is an important design consideration for the transcription pipeline."),
        body("Data migration from Google Sheets carries inherent quality risks due to inconsistent field usage, incomplete records, and undocumented formatting conventions. The current LAT structure includes the activation methodology, scoring framework, and country-level assessments linked to Salesforce. The benchmarking dataset comprises approximately 60,000 records in Google Sheets connected to Power BI. The migration workstream is treated as a full sub-program with dry-run, reconciliation, and rollback requirements."),
        body("Change management and adoption risk must be addressed through structured training, pilot hypercare, and country-specific rollout support. Legal and information security gating must be completed before any sensitive data access, with NDA/DPA requirements satisfied before detailed field structure and scoring logic documentation is shared. The collaborative nature of baseline methodology and pilot country selection requires alignment with Aceli stakeholders during discovery."),

        // ── 10. Consortium Feedback Integration ──
        heading("10. Consortium Feedback Integration"),
        body("This section documents the key clarifications received from the Aceli consortium following the initial RFP review and how they have been incorporated into this vision brief and the broader Sprint 0 deliverables."),
        bulletItem("The current LAT is a relatively lightweight Google Sheets tool containing the activation methodology, scoring framework, assessment questions, scoring approaches across six activation areas, and country-level lender activation assessments linked to Salesforce reporting outputs. Detailed field structures will be shared under NDA."),
        bulletItem("Salesforce Enterprise Edition with custom objects serves as the system of record for lender relationship management, but the LAT scoring framework is not yet embedded in Salesforce and remains in Google Sheets. A Salesforce sandbox is available."),
        bulletItem("Claude Team/Enterprise is the confirmed AI platform under the Claude for Nonprofits programme. Production LLM processing involving sensitive programme data must occur within approved enterprise environments. Ongoing platform licensing costs are managed separately from the capped implementation budget."),
        bulletItem("Aceli does not currently maintain a formalized measurement of reconciliation time. Baseline measurement methodology must be collaboratively established during discovery through workflow observation, stakeholder interviews, and practical measurement approaches, with benchmark values jointly agreed between Aceli and the vendor."),
        bulletItem("The pilot country will be jointly agreed during Phase 0 discovery, considering operational readiness, stakeholder availability, lender concentration, implementation practicality, and overall delivery risk within the 90-day pilot window."),
        bulletItem("Country teams generally operate in environments with intermittent or variable mobile connectivity rather than prolonged periods of complete offline operation. The platform should support resilient low-bandwidth usage and offline capture where appropriate, particularly during field engagement and travel between lender locations."),
        bulletItem("Most lender engagement conversations are primarily in English, but transcription and extraction workflows must accommodate regional accents, agricultural terminology, and limited multilingual code-switching including occasional Swahili and local-language phrases."),
        bulletItem("Approximately 55 lending institutions across five countries are in scope, including commercial banks, local NBFIs, SACCOs, and global social lenders, with loan sizes ranging from approximately US$10,000 to US$1.5 million and significant concentration in smaller-ticket SME lending."),
        bulletItem("The benchmarking dataset of approximately 60,000 records in Google Sheets connected to Power BI is not being rebuilt. Power BI reads from Salesforce via standard connector alongside Google Sheets. The intent is to ensure LAT outputs flow into the approved analytics environment through controlled pathways."),
        bulletItem("Core stakeholder interviews include Product Design, Product Operations, Country Leads, MEL, and Executive Office staff. External stakeholder interviews are optional but encouraged where they materially strengthen the opportunity scan."),
        body("These clarifications have been integrated throughout this document and into the RTM v1, Environment Strategy, and Security and Tenant Approval Checklist updates."),

        // ── 11. Next Steps ──
        heading("11. Next Steps"),
        body("Following Sprint 0 mobilization, the immediate next steps are: execute Sprint 1 discovery activities including current-state process mapping, collaborative baseline measurement design, stakeholder interviews with Product Design, Product Operations, Country Leads, MEL, and Executive Office staff, and user persona development; produce the BRD, PRD, and initial user story catalogue; agree pilot country selection criteria with Aceli; and prepare for the Sprint 2 design phase where the target-state architecture, SRS, FRS, and integration specifications will be finalized. All work must comply with the mandatory agent rules, quality gates, and documentation requirements defined in the Sprint Plan."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/sprint0/Aceli_LAT_Vision_Brief.docx", buf);
  console.log("Vision Brief generated successfully.");
});
