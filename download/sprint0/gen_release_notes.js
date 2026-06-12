const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, AlignmentType, HeadingLevel, WidthType,
  BorderStyle, ShadingType,
} = require("docx");
const fs = require("fs");

// ── Palette ──
const P = {
  body: "182030",
  secondary: "506070",
  table: {
    headerBg: "1A2330",
    headerText: "FFFFFF",
    accentLine: "1A2330",
    innerLine: "D0D0D0",
  },
};
const c = (hex) => hex.replace("#", "");

// ── Table borders ──
const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
  left: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
  right: { style: BorderStyle.SINGLE, size: 1, color: P.table.accentLine },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
};

// ── Helpers ──
function heading(text, level = HeadingLevel.HEADING_1) {
  const sizeMap = {
    [HeadingLevel.HEADING_1]: 32,
    [HeadingLevel.HEADING_2]: 28,
    [HeadingLevel.HEADING_3]: 24,
  };
  const sz = sizeMap[level] || 28;
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 120, line: 312 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: sz,
        color: P.body,
        font: { ascii: "Times New Roman", eastAsia: "Times New Roman" },
      }),
    ],
  });
}

function bodyPara(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 80 },
    children: [
      new TextRun({
        text,
        size: 24,
        color: P.body,
        font: { ascii: "Times New Roman", eastAsia: "Times New Roman" },
      }),
    ],
  });
}

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
    children: [
      new Paragraph({
        spacing: { line: 312, before: 40, after: 40 },
        children: [
          new TextRun({
            text,
            bold: true,
            size: 22,
            color: P.table.headerText,
            font: { ascii: "Times New Roman", eastAsia: "Times New Roman" },
          }),
        ],
      }),
    ],
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
    children: [
      new Paragraph({
        spacing: { line: 312, before: 40, after: 40 },
        children: [
          new TextRun({
            text,
            size: 22,
            color: P.body,
            font: { ascii: "Times New Roman", eastAsia: "Times New Roman" },
          }),
        ],
      }),
    ],
  });
}

function makeTable(headers, rows, colWidths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => headerCell(h, colWidths[i])),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            cantSplit: true,
            children: r.map((text, i) => dataCell(text, colWidths[i])),
          })
      ),
    ],
  });
}

// ── Page setup ──
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

// ── Release Information data ──
const releaseInfoRows = [
  ["Version", "v0.1.0-mobilization"],
  ["Sprint Number", "Sprint 0"],
  ["Release Date", "2026-06-12"],
  ["Release Type", "Documentation Release"],
  ["Approver", "Delivery Orchestrator"],
];

// ── Build Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: { ascii: "Times New Roman", eastAsia: "Times New Roman" },
          size: 24,
          color: P.body,
        },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: {
          font: { ascii: "Times New Roman", eastAsia: "Times New Roman" },
          size: 32,
          bold: true,
          color: P.body,
        },
        paragraph: { spacing: { before: 360, after: 160, line: 312 } },
      },
      heading2: {
        run: {
          font: { ascii: "Times New Roman", eastAsia: "Times New Roman" },
          size: 28,
          bold: true,
          color: P.body,
        },
        paragraph: { spacing: { before: 240, after: 120, line: 312 } },
      },
      heading3: {
        run: {
          font: { ascii: "Times New Roman", eastAsia: "Times New Roman" },
          size: 24,
          bold: true,
          color: P.body,
        },
        paragraph: { spacing: { before: 200, after: 100, line: 312 } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: pgSize,
          margin: pgMargin,
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Aceli LAT v0.1.0-mobilization Release Notes",
                  size: 18,
                  color: "808080",
                  font: { ascii: "Times New Roman", eastAsia: "Times New Roman" },
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 18,
                  color: "808080",
                  font: { ascii: "Times New Roman", eastAsia: "Times New Roman" },
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ── 1. Release Information ──
        heading("1. Release Information"),
        makeTable(
          ["Field", "Value"],
          releaseInfoRows,
          [35, 65]
        ),

        // ── 2. Included Features ──
        heading("2. Included Features"),
        bodyPara(
          "Sprint 0 is a mobilization sprint with no application features. This release establishes the governance, documentation, and operational foundations required for all subsequent sprint deliveries. The following artifacts are included:"
        ),
        bodyPara("Vision Brief (v1.0)"),
        bodyPara("Delivery Charter (v1.0)"),
        bodyPara("Governance Model (v1.0)"),
        bodyPara("Documentation Index (v1.0)"),
        bodyPara("Requirements Traceability Matrix v1"),
        bodyPara("Environment Strategy Document (v1.0)"),
        bodyPara("Security and Tenant Approval Checklist (v1.0)"),
        bodyPara("AI Agent Operating Rules (v1.0)"),

        // ── 3. Fixes ──
        heading("3. Fixes"),
        bodyPara(
          "No fixes in this release. This is the initial mobilization release."
        ),

        // ── 4. Schema Changes ──
        heading("4. Schema Changes"),
        bodyPara(
          "No schema changes in this release. Database schema design will be finalized in Sprint 2 (design sign-off) and implemented in Sprint 3 (platform foundation)."
        ),

        // ── 5. Integration Changes ──
        heading("5. Integration Changes"),
        bodyPara(
          "No integration changes in this release. Salesforce integration patterns and API contracts will be designed in Sprint 2 and implemented in Sprint 5."
        ),

        // ── 6. Known Issues ──
        heading("6. Known Issues"),
        bodyPara(
          "No known issues at this release. The program is in mobilization phase; technical known issues will be tracked starting Sprint 3."
        ),

        // ── 7. Rollback Notes ──
        heading("7. Rollback Notes"),
        bodyPara(
          "This is a documentation-only release. No rollback is required as no runtime components are deployed. Documentation artifacts are version-controlled in the program repository."
        ),

        // ── 8. Documentation Updates ──
        heading("8. Documentation Updates"),
        bodyPara(
          "All documents listed in the Included Features section are newly created in this sprint. No updates to existing documents apply."
        ),

        // ── 9. Next Sprint Preview ──
        heading("9. Next Sprint Preview"),
        bodyPara(
          "Sprint 1 (Discovery, Business Analysis, and Baseline Capture) will focus on: mapping the current Google Sheets LAT process and pain points; building the current-state process map for all user roles; designing the baseline time-and-motion study for the reconciliation process; defining data domains (lender profile, activation status, narrative notes, extracted updates, review decisions, sync state); identifying all in-scope and out-of-scope capabilities; building the initial user story backlog; and recording assumptions and open questions."
        ),
        bodyPara(
          "Sprint 1 documentation deliverables: BRD, PRD, Stakeholder Matrix, Current-State Process Map, Baseline Measurement Plan, Baseline Evidence Capture Template, User Persona Pack, Initial User Story Catalogue."
        ),
      ],
    },
  ],
});

// ── Write file ──
const outPath =
  "/home/z/my-project/download/sprint0/Aceli_LAT_v0.1.0_Mobilization_Release_Notes.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("Release Notes generated successfully at:", outPath);
});
