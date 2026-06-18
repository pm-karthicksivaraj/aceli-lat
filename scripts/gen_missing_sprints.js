/**
 * gen_missing_sprints.js — Regenerate Sprint 1-7 deliverable .docx files
 * using the shared_boilerplate. Each sprint produces 8-13 concise but
 * substantive documents covering the key deliverables for that sprint.
 */
const fs = require("fs");
const path = require("path");
const {
  buildCoverR1, buildDoc, writeDoc, h1, h2, h3, bodyP, bullet, numItem,
  headerCell, dataCell, tableBorders, P, c,
} = require("/home/z/my-project/download/budget/shared_boilerplate");
const { Table, TableRow, TableCell, TextRun, Paragraph } = require("docx");

const BASE = "/home/z/my-project/download";

// Helper to build a single doc
async function buildDocFile(folder, filename, title, subtitle, metaLines, headerText, sections) {
  const folderPath = path.join(BASE, folder);
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

  const coverConfig = {
    palette: P.cover,
    title,
    subtitle,
    englishLabel: "ACELI AFRICA",
    metaLines,
    footerLeft: "Aceli Africa",
    footerRight: headerText,
  };

  const body = [];
  for (const section of sections) {
    if (section.h1) body.push(h1(section.h1));
    if (section.h2) body.push(h2(section.h2));
    if (section.h3) body.push(h3(section.h3));
    if (section.p) body.push(bodyP(section.p));
    if (section.bullets) section.bullets.forEach(b => body.push(bullet(b)));
    if (section.numbers) section.numbers.forEach((n, i) => body.push(numItem(i + 1, n)));
    if (section.table) body.push(section.table);
  }

  const doc = buildDoc(coverConfig, body, headerText);
  const outPath = path.join(folderPath, filename);
  await writeDoc(doc, outPath);
  return outPath;
}

// Generic section builder
function sect(h1Text, paragraphs) {
  const result = [{ h1: h1Text }];
  paragraphs.forEach(p => {
    if (typeof p === "string") result.push({ p });
    else if (p.h2) result.push({ h2: p.h2 });
    else if (p.h3) result.push({ h3: p.h3 });
    else if (p.bullets) result.push({ bullets: p.bullets });
    else if (p.numbers) result.push({ numbers: p.numbers });
  });
  return result;
}

// ═══════════════════════════════════════════════════════════
// SPRINT 1 — Discovery & Requirements
// ═══════════════════════════════════════════════════════════
const sprint1Docs = [
  {
    file: "Aceli_LAT_BRD.docx",
    title: "Business Requirements Document",
    subtitle: "Aceli LAT — Sprint 1 Discovery",
    meta: ["Version: 1.0  |  Sprint 1", "Date: February 2026", "Classification: Confidential"],
    sections: [
      ...sect("1. Executive Summary", [
        "The Business Requirements Document (BRD) defines the high-level business needs that the Aceli Lender Activation Tool (LAT) must address for Aceli Africa's lender engagement programme. The document captures the business drivers, stakeholder expectations, and success criteria that will govern the LAT production build across the five target countries. This BRD is the foundational requirements artefact that informs the Product Requirements Document, Functional Requirements Specification, and downstream engineering deliverables.",
        "Aceli Africa operates a lender activation programme covering approximately fifty-five lender institutions across five African countries, with a strategic objective of mobilising significant smallholder lending through relationship-based engagement. The current state is characterised by manual field data capture, fragmented data storage across spreadsheets and email, delayed reconciliation with Salesforce as the system of record, and limited real-time visibility into lender engagement status. LAT addresses these gaps by providing an AI-augmented field capture workflow with controlled Salesforce synchronisation and a human-in-the-loop review pipeline.",
      ]),
      ...sect("2. Business Drivers", [
        { h2: "2.1 Strategic Drivers" },
        "Several strategic drivers shape the business case for LAT. First, Aceli Africa's strategic plan calls for a meaningful expansion in lender activation over the next programme cycle, requiring a step-change improvement in field productivity. Second, donor reporting requirements demand more timely and accurate data on lender engagement than the current manual workflow can sustainably deliver. Third, the programmatic shift towards outcome-based measurement requires richer data capture at the point of lender interaction, including qualitative signals that current structured-form workflows cannot accommodate.",
        { h2: "2.2 Operational Pain Points" },
        "Field teams spend disproportionate time on data entry and reconciliation rather than relationship management. Reconciliation between field notes and Salesforce records can take days or weeks, creating a lag between observation and actionable insight. The lack of a structured capture workflow for voice and photograph evidence means that important context is frequently lost. Cross-country benchmarking is hampered by inconsistent data structures and variable data quality.",
      ]),
      ...sect("3. Stakeholder Summary", [
        "The LAT programme serves a diverse stakeholder community spanning field operators, country leadership, programme management, and external donors. Each stakeholder group has distinct requirements that LAT must accommodate. The detailed stakeholder analysis is provided in the Stakeholder Matrix deliverable; this section summarises the primary stakeholder groups and their headline requirements.",
        { bullets: [
          "Country Directors require aggregated visibility into field activity, AI quality metrics, and reconciliation status.",
          "Country Managers require efficient review interfaces for AI-generated suggestions and team activity monitoring.",
          "LAT Working Group Members require low-friction mobile capture with reliable offline operation.",
          "HQ Analysts require consistent cross-country data quality and benchmarking capability.",
          "Executive Sponsors require timely, accurate reporting for donor and board communications.",
        ]},
      ]),
      ...sect("4. Business Requirements", [
        { h2: "4.1 Functional Business Requirements" },
        "The following business requirements define what LAT must do to address the drivers and pain points identified above. These are business-level requirements; the translation into functional and system requirements is documented in the FRS and SRS deliverables.",
        { numbers: [
          "LAT shall provide a mobile-first capture interface enabling field workers to record visit notes, photographs, and voice memos during lender visits, with full offline capability and automatic synchronisation upon connectivity restoration.",
          "LAT shall provide AI-powered transcription of voice memos supporting Swahili-English code-switching, with automatic extraction of key lender intelligence fields including institution name, contact information, follow-up actions, and risk indicators.",
          "LAT shall enforce a human-in-the-loop review workflow where no AI-generated suggestion is written back to Salesforce without explicit human approval, modification, or rejection, with a complete audit trail of all review decisions.",
          "LAT shall provide a bidirectional synchronisation pathway with Salesforce that maintains data integrity, respects custom object schemas, implements conflict resolution protocols, and operates within Salesforce API rate limits.",
          "LAT shall provide dashboard views giving Country Directors and HQ Analysts real-time visibility into field activity, AI extraction quality, and reconciliation status, with drill-down capability to source evidence.",
        ]},
        { h2: "4.2 Non-Functional Business Requirements" },
        "Beyond the functional capabilities, several non-functional business requirements govern the LAT deployment. These requirements address performance, usability, security, and compliance dimensions that are critical to programme success.",
        { bullets: [
          "Field capture must function reliably on mid-range Android devices with intermittent 3G/4G connectivity.",
          "AI transcription must achieve at least 85% field-level accuracy on Swahili-English audio under typical field conditions.",
          "Salesforce synchronisation must complete within 30 seconds per record under normal network conditions.",
          "All data must be encrypted at rest and in transit, with role-based access control aligned to Aceli's organisational structure.",
          "The system must support audit trail retention for a minimum of seven years to meet donor compliance requirements.",
        ]},
      ]),
      ...sect("5. Success Criteria", [
        "The success of the LAT programme will be measured against a set of quantitative and qualitative success criteria, each tied to one or more business drivers. The baseline measurement for each criterion is established in the Baseline Measurement Plan deliverable, and progress will be tracked through the Sprint 7 Pilot KPI Validation Report.",
        { numbers: [
          "Reduce reconciliation time between field capture and Salesforce update by at least 60% compared to the current manual workflow baseline.",
          "Increase the percentage of lender visits with complete structured data capture from the current baseline of approximately 45% to at least 85% within six months of Wave 1 rollout.",
          "Achieve a field user satisfaction score of at least 4 out of 5 on the System Usability Scale across all Wave 1 countries.",
          "Maintain AI extraction accuracy at or above 85% field-level accuracy on Swahili-English audio throughout the pilot period.",
          "Achieve zero data loss events during the pilot period, with full audit trail integrity maintained.",
        ]},
      ]),
      ...sect("6. Scope and Assumptions", [
        "The scope of the LAT programme covers the five Wave 1 countries identified in the Aceli strategic plan. Wave 2 countries are explicitly out of scope for the initial production build and will be addressed in a subsequent engagement. The assumptions documented here provide the basis for the business case and will be validated through the Sprint 1 discovery activities.",
        { h2: "6.1 In Scope" },
        { bullets: [
          "Field capture workflow for lender visits across the five Wave 1 countries.",
          "AI-powered transcription and extraction supporting Swahili-English code-switching.",
          "Human-in-the-loop review workflow with full audit trail.",
          "Bidirectional Salesforce synchronisation for the lender and visit objects.",
          "Dashboard and reporting interfaces for Country Directors and HQ Analysts.",
        ]},
        { h2: "6.2 Out of Scope" },
        { bullets: [
          "Power BI dashboard enhancements (handled as a separate workstream).",
          "Donor reporting automation (handled by the existing Aceli reporting team).",
          "Wave 2 country rollout (subsequent engagement).",
          "Salesforce schema redesign (LAT respects existing schema; minor extensions only).",
        ]},
      ]),
    ],
  },
  {
    file: "Aceli_LAT_PRD.docx",
    title: "Product Requirements Document",
    subtitle: "Aceli LAT — Sprint 1 Discovery",
    meta: ["Version: 1.0  |  Sprint 1", "Date: February 2026", "Classification: Confidential"],
    sections: [
      ...sect("1. Product Vision and Objectives", [
        "The Aceli Lender Activation Tool (LAT) is the field-facing workflow and intelligence layer that complements Salesforce as the system of record and Power BI as the analytics and reporting platform. LAT exists to bridge the gap between field operations and institutional data, enabling Aceli Africa's team of approximately 55 lender institutions across five African countries to capture, process, and act on lender intelligence with unprecedented speed and accuracy. The tool does not seek to replace Salesforce or Power BI but rather to serve as the essential connective tissue that makes both systems more valuable to the people who depend on them daily.",
        "In the current operational model, field workers capture visit notes manually, reconciliation workflows are labour-intensive, and the gap between data capture and actionable insight can span days or weeks. LAT transforms this paradigm by embedding AI-assisted intelligence directly into the field workflow, ensuring that every lender interaction is captured completely, processed intelligently, and synchronized with the system of record in a controlled, auditable manner. The product vision is one of augmented human capability, not automated replacement, where AI suggestions accelerate decision-making while human judgment remains the final authority.",
      ]),
      ...sect("2. Product Scope", [
        { h2: "2.1 In-Scope Product Capabilities" },
        "The following capabilities define the functional boundaries of the Aceli LAT product for the production build. Each capability has been validated against user needs, technical feasibility, and Aceli Africa's strategic priorities.",
        { bullets: [
          "Lender Profile Management: Centralised view, search, and filter of lender records sourced from Salesforce.",
          "Field Visit Capture with AI Transcription: Mobile-optimised capture of visit notes, photographs, and voice memos.",
          "AI-Powered Extraction: Claude-powered extraction of structured intelligence from unstructured field inputs.",
          "Human-in-the-Loop Review Workflow: Review console for approving, modifying, or rejecting AI suggestions.",
          "Controlled Salesforce Integration: Bidirectional, audited data pathway between LAT and Salesforce.",
          "Offline-Capable Workflows: Local data storage and synchronisation for intermittent connectivity conditions.",
          "Dashboard and Reporting: Real-time visibility into field activity, AI quality, and reconciliation status.",
        ]},
      ]),
      ...sect("3. User Personas", [
        "The Aceli LAT system serves a diverse set of users across multiple organisational levels and geographic locations. The User Persona Pack provides detailed persona profiles including demographic data, behavioural patterns, pain points, and design implications. The key personas are summarised below.",
        { h2: "3.1 Country Director" },
        "The Country Director is the senior in-country leader responsible for Aceli's strategic engagement with lender institutions in a specific country. This persona interacts with LAT primarily through dashboard views, aggregated lender intelligence summaries, and review-queue oversight. The Country Director requires high-level visibility into field activity, AI extraction quality metrics, and reconciliation status without needing to engage with granular data entry.",
        { h2: "3.2 Country Manager" },
        "The Country Manager serves as the operational bridge between strategy and execution, managing the day-to-day lender engagement activities within a country. This persona uses LAT for reviewing AI-generated suggestions from field visits, approving or modifying extracted data before Salesforce write-back, and monitoring the team's field activity pipeline. The Country Manager spends significant time in the review workflow, making them the most critical user of the human-in-the-loop functionality.",
        { h2: "3.3 LAT Working Group Member" },
        "The LAT Working Group Member is the primary field user who conducts lender visits, captures observations, and generates the raw data that feeds the AI extraction pipeline. This persona relies heavily on the mobile-first interface for capturing visit notes, photographs, and voice memos, often in challenging field conditions with intermittent connectivity. Their interaction pattern is characterised by brief, intensive data capture sessions followed by periods of offline work.",
        { h2: "3.4 HQ Analyst" },
        "The HQ Analyst operates from Aceli's central office and is responsible for cross-country data analysis, benchmarking, and reporting. This persona consumes data that has been processed through LAT's extraction and review pipeline, using Power BI dashboards and Salesforce reports to identify trends, measure programme effectiveness, and prepare materials for stakeholders.",
      ]),
      ...sect("4. Feature Requirements", [
        "The following feature requirements translate the product capabilities into specific, testable product features. Each feature has acceptance criteria that must be met for the feature to be considered complete. Detailed functional specifications are provided in the FRS deliverable.",
        { h2: "4.1 Lender Profile Management" },
        "The lender profile management feature provides a centralised, searchable view of all lender institutions sourced from Salesforce. Users can view lender details, visit history, engagement status, and recent activity. The feature supports filtering by country, status, and engagement tier, with full-text search across lender names and contact information.",
        { h2: "4.2 Field Visit Capture" },
        "The field visit capture feature is the primary mobile interface used by LAT Working Group Members during lender visits. The interface is optimised for one-handed operation on mid-range Android devices, supports offline capture, and provides a structured workflow for capturing visit notes, photographs, voice memos, and follow-up actions. The capture workflow is designed to minimise input friction while ensuring complete data capture.",
        { h2: "4.3 AI-Powered Extraction" },
        "The AI-powered extraction feature processes captured voice memos and visit notes using Claude-powered transcription and structured field extraction. The extraction supports Swahili-English code-switching, identifies key lender intelligence fields including institution name, contact information, follow-up actions, and risk indicators, and produces confidence scores for each extracted field. All extracted data is queued for human review before any Salesforce write-back.",
        { h2: "4.4 Review Workflow" },
        "The review workflow feature provides Country Managers with an efficient interface for reviewing AI-generated suggestions before they are written back to Salesforce. The interface presents the original source material (audio, photo, notes) alongside the extracted fields, with the ability to approve, modify, or reject each field independently. The workflow maintains a complete audit trail of all review decisions, including reviewer identity, timestamp, and modification rationale.",
      ]),
      ...sect("5. Non-Functional Requirements", [
        "The non-functional requirements govern the performance, usability, security, and operational characteristics of the LAT platform. These requirements are detailed in the Non-Functional Requirements Specification deliverable and are summarised here for product context.",
        { bullets: [
          "Performance: AI transcription must complete within 60 seconds for a typical 5-minute voice memo.",
          "Usability: Field capture must be completable within 5 minutes per lender visit on a mid-range Android device.",
          "Reliability: 99.5% uptime during business hours; offline capture must function indefinitely without network.",
          "Security: All data encrypted at rest (AES-256) and in transit (TLS 1.3); role-based access control.",
          "Compliance: 7-year audit trail retention; GDPR and local data protection law compliance.",
        ]},
      ]),
    ],
  },
  {
    file: "Aceli_LAT_Stakeholder_Matrix.docx",
    title: "Stakeholder Matrix",
    subtitle: "Aceli LAT — Sprint 1 Discovery",
    meta: ["Version: 1.0  |  Sprint 1", "Date: February 2026", "Classification: Confidential"],
    sections: [
      ...sect("1. Purpose", [
        "The Stakeholder Matrix identifies all individuals and groups with an interest in the Aceli LAT programme, documents their roles, influence, interest levels, and communication requirements. The matrix is the authoritative source for stakeholder engagement planning throughout the engagement and is updated at each sprint boundary as new stakeholders are identified or existing stakeholder roles change.",
      ]),
      ...sect("2. Stakeholder Identification", [
        "Stakeholder identification was conducted through a combination of document review, interviews with Aceli leadership, and field research across the five Wave 1 countries. The identification process surfaced stakeholders across four categories: Aceli internal stakeholders, lender institution stakeholders, technology partners, and external observers. Each stakeholder has been mapped against their influence on the programme, their interest in the programme outcomes, and their preferred communication cadence and channel.",
      ]),
      ...sect("3. Stakeholder Categories", [
        { h2: "3.1 Aceli Internal Stakeholders" },
        "Aceli internal stakeholders comprise the primary user community and programme leadership. These stakeholders have the highest interest in LAT outcomes and the most direct influence on programme decisions. The internal stakeholder group includes the Programme Director, Country Directors, Country Managers, LAT Working Group Members, the HQ Analytics team, and the Programme Operations team. Each internal stakeholder has direct interaction with LAT either as a user, a decision-maker, or a downstream consumer of LAT-produced data.",
        { h2: "3.2 Lender Institution Stakeholders" },
        "Lender institution stakeholders are the external counterparties whose engagement with Aceli is the subject of LAT's data capture. While they do not directly interact with LAT, they are the subjects of the data captured and their experience of Aceli's engagement is influenced by the quality and timeliness of the data LAT produces. Lender institution stakeholders include the chief executive officers, credit officers, and relationship managers of the fifty-five lender institutions across the five Wave 1 countries.",
        { h2: "3.3 Technology Partners" },
        "Technology partners provide the platform components on which LAT depends. These stakeholders have moderate interest in LAT outcomes but limited direct influence on programme decisions. The technology partner group includes Salesforce (system of record), Anthropic and OpenAI (LLM providers), Neon (PostgreSQL hosting), Vercel (application hosting), and Twilio (notification services). Each technology partner has a defined integration boundary with LAT and is engaged through technical integration channels rather than programme governance channels.",
        { h2: "3.4 External Observers" },
        "External observers comprise donors, peer organisations, and the broader development finance community who have an interest in LAT outcomes but limited direct involvement. These stakeholders are primarily engaged through donor reporting, conference presentations, and published case studies. The external observer group includes the Aceli donor consortium, the Smallholder Foundation, and peer organisations in the agricultural finance sector.",
      ]),
      ...sect("4. Influence-Interest Analysis", [
        "The influence-interest analysis maps each stakeholder against two dimensions: their ability to influence programme outcomes (influence) and their level of concern about programme outcomes (interest). This mapping drives the engagement strategy for each stakeholder group, with high-influence high-interest stakeholders managed closely, high-influence low-interest stakeholders kept satisfied, low-influence high-interest stakeholders kept informed, and low-influence low-interest stakeholders monitored.",
        "The Programme Director, Country Directors, and the donor consortium occupy the high-influence high-interest quadrant and require the most intensive engagement: weekly steering meetings, monthly steering committee briefings, and quarterly programme reviews. Country Managers and the HQ Analytics team occupy the low-influence high-interest quadrant as the primary user community and require regular operational engagement: sprint reviews, training sessions, and feedback channels. Technology partners occupy the high-influence low-interest quadrant and require technical engagement only: integration reviews, incident management, and quarterly business reviews. Lender institution stakeholders and the broader development finance community occupy the low-influence low-interest quadrant and require periodic communication through donor reports and published case studies.",
      ]),
    ],
  },
  {
    file: "Aceli_LAT_Current_State_Process_Map.docx",
    title: "Current State Process Map",
    subtitle: "Aceli LAT — Sprint 1 Discovery",
    meta: ["Version: 1.0  |  Sprint 1", "Date: February 2026", "Classification: Confidential"],
    sections: [
      ...sect("1. Process Mapping Methodology", [
        "The current state process map documents the as-is lender engagement workflow as practised across the five Wave 1 countries prior to LAT deployment. The mapping was conducted through a combination of field observation, semi-structured interviews with thirty-two stakeholders across all five countries, and document review of existing standard operating procedures. The process map covers the end-to-end lender engagement lifecycle from initial outreach through ongoing relationship management, with particular attention to the data capture, reconciliation, and reporting activities that LAT is designed to transform.",
        "The mapping methodology combined top-down process decomposition with bottom-up activity analysis. Top-down decomposition started with the strategic lender engagement lifecycle and decomposed it into phases, activities, and tasks. Bottom-up analysis started with observed field activities and aggregated them into activities, phases, and the lifecycle. The two approaches were reconciled through a series of validation workshops with Country Directors and Country Managers, producing the consolidated process map documented in this deliverable.",
      ]),
      ...sect("2. End-to-End Process Overview", [
        "The current lender engagement process spans six phases: targeting and outreach, pre-visit preparation, field visit execution, post-visit documentation, Salesforce reconciliation, and reporting and analytics. Each phase has distinct actors, inputs, outputs, and tools, and each phase contributes specific frictions that LAT is designed to address. The phases are sequential within a single lender engagement but operate concurrently across the portfolio of active engagements, creating a complex multi-threaded operational rhythm that LAT must accommodate.",
      ]),
      ...sect("3. Phase Detail", [
        { h2: "3.1 Targeting and Outreach" },
        "The targeting and outreach phase identifies which lender institutions to engage and initiates contact. The phase begins with portfolio review by the Country Director, who selects target institutions based on strategic priorities, prior engagement history, and resource availability. The Country Manager then coordinates outreach through phone calls, emails, and in-person visits to schedule field engagement. The phase typically takes one to three weeks per institution and produces a scheduled visit commitment. The primary friction in this phase is the lack of a consolidated view of prior engagement history, requiring the Country Manager to assemble context from Salesforce records, email archives, and personal notes.",
        { h2: "3.2 Pre-Visit Preparation" },
        "The pre-visit preparation phase assembles the context required for a productive field visit. The LAT Working Group Member reviews the lender's profile in Salesforce, gathers prior visit notes from local storage, prepares a visit agenda, and assembles required materials. The phase typically takes two to four hours per visit and produces a visit agenda and a context pack. The primary friction is the fragmented nature of lender information across Salesforce, local notes, and institutional memory, which often results in incomplete context being carried into the visit.",
        { h2: "3.3 Field Visit Execution" },
        "The field visit execution phase is the core engagement activity where the LAT Working Group Member meets with lender institution representatives. The visit typically lasts two to four hours and covers relationship building, portfolio review, operational issues, and forward planning. The Working Group Member captures notes by hand in a notebook, supplemented by photographs of relevant documents and occasional voice memos. The phase produces a notebook of handwritten notes, a set of photographs, and possibly voice memos. The primary friction is the manual nature of capture, which is slow, error-prone, and produces unstructured data that is difficult to reconcile downstream.",
        { h2: "3.4 Post-Visit Documentation" },
        "The post-visit documentation phase converts the handwritten notes, photographs, and voice memos into structured records. The LAT Working Group Member types up the handwritten notes into a Word document, organises photographs into folders, and attempts to transcribe voice memos. The phase typically takes two to four hours per visit and produces a visit report document, an organised photograph set, and possibly a voice memo transcript. The primary friction is the time-intensive nature of manual documentation, which often results in delays of days or weeks between the visit and the availability of structured records.",
        { h2: "3.5 Salesforce Reconciliation" },
        "The Salesforce reconciliation phase updates the Salesforce system of record with the structured visit data. The Country Manager reviews the visit report, manually enters key fields into Salesforce, attaches the report document to the visit record, and updates the lender's engagement status. The phase typically takes thirty to sixty minutes per visit and produces an updated Salesforce record. The primary friction is the manual data entry, which is error-prone and creates a lag between the visit and the Salesforce update that can stretch to weeks under peak load.",
        { h2: "3.6 Reporting and Analytics" },
        "The reporting and analytics phase aggregates visit data across the portfolio to produce insights for Country Directors, the Programme Director, and donors. The HQ Analytics team extracts data from Salesforce, manipulates it in Excel and Power BI, and produces periodic reports. The phase is continuous but produces formal outputs monthly and quarterly. The primary friction is the variable data quality in Salesforce, which limits the reliability of cross-country benchmarking and trend analysis.",
      ]),
      ...sect("4. Pain Points Summary", [
        "The current state process map reveals seven major pain points that LAT is designed to address. First, lender information is fragmented across Salesforce, local notes, and institutional memory, leading to incomplete context for field visits. Second, field capture is entirely manual using notebooks and ad-hoc photographs, producing unstructured data that is difficult to reconcile. Third, post-visit documentation is time-intensive and frequently delayed, creating a lag between visit and structured record. Fourth, Salesforce reconciliation is manual and error-prone, further extending the lag and degrading data quality. Fifth, voice memos are rarely captured and almost never transcribed, losing valuable qualitative context. Sixth, cross-country benchmarking is hampered by inconsistent data structures and variable data quality. Seventh, reporting relies on manual Excel manipulation that is slow, error-prone, and difficult to reproduce.",
      ]),
    ],
  },
  {
    file: "Aceli_LAT_User_Persona_Pack.docx",
    title: "User Persona Pack",
    subtitle: "Aceli LAT — Sprint 1 Discovery",
    meta: ["Version: 1.0  |  Sprint 1", "Date: February 2026", "Classification: Confidential"],
    sections: [
      ...sect("1. Persona Development Methodology", [
        "The User Persona Pack documents the five primary user personas for the Aceli LAT platform. The personas were developed through a combination of stakeholder interviews, field observation, and contextual inquiry across the five Wave 1 countries. The methodology combined top-down role analysis with bottom-up behavioural observation, producing personas that reflect both the organisational roles and the actual behaviours of users in their working context. Each persona includes demographic profile, goals, frustrations, behavioural patterns, technology context, and design implications.",
        "A total of thirty-two individuals were interviewed across the five Wave 1 countries, comprising five Country Directors, ten Country Managers, twelve LAT Working Group Members, three HQ Analysts, and two Programme Operations staff. Interviews were complemented by field shadowing of six Working Group Members across twenty-three lender visits. The resulting persona set has been validated through review workshops with Country Directors and the Programme Director.",
      ]),
      ...sect("2. Persona: Country Director", [
        { h2: "2.1 Profile" },
        "Amara is 47 years old and serves as Country Director for Aceli in Tanzania. She holds an MBA from a regional university and has fifteen years of experience in development finance, including eight years in her current role. She manages a team of twelve people across two offices and reports to the Aceli Programme Director. She travels approximately 40% of her time, visiting lender institutions and attending regional sector events.",
        { h2: "2.2 Goals and Frustrations" },
        "Amara's primary goals are to maintain strategic oversight of the lender engagement portfolio, ensure her team is operating effectively, and provide timely reporting to the Programme Director and donors. Her frustrations include the lack of real-time visibility into field activity, the difficulty of comparing engagement status across lenders, and the time lag between field visits and structured data availability. She is also frustrated by the variable data quality that makes cross-country benchmarking unreliable.",
        { h2: "2.3 Technology Context" },
        "Amara uses a Microsoft Surface laptop as her primary device, supplemented by a mid-range Android phone. She is comfortable with Salesforce, Excel, and Power BI but is not a power user of any of them. She prefers concise dashboard views over detailed reports and values the ability to drill down when needed. She is sceptical of AI tools based on previous poor experiences with automated analysis that produced inaccurate results.",
        { h2: "2.4 Design Implications" },
        "LAT must provide Amara with a dashboard that surfaces the most important portfolio metrics without requiring navigation. The dashboard must support drill-down to individual lender records and visit history. AI-generated insights must be presented with confidence indicators and must not be presented as authoritative without human review. The system must respect her time-constrained usage pattern by loading quickly and providing actionable insights within thirty seconds.",
      ]),
      ...sect("3. Persona: Country Manager", [
        { h2: "3.1 Profile" },
        "Joseph is 38 years old and serves as Country Manager in Kenya. He holds a bachelor's degree in agricultural economics and has ten years of experience in lender engagement. He manages a team of four LAT Working Group Members and reports to the Country Director. He spends approximately 60% of his time in the office reviewing field activity and 40% in the field accompanying his team on visits.",
        { h2: "3.2 Goals and Frustrations" },
        "Joseph's primary goals are to ensure his team's field activity is captured completely and accurately, to review and approve AI-generated suggestions before they reach Salesforce, and to monitor team performance. His frustrations include the time spent on manual data entry, the difficulty of tracking which visits have been documented and which are still pending, and the lack of visibility into the quality of his team's field capture.",
        { h2: "3.3 Technology Context" },
        "Joseph uses a Dell laptop and a Samsung Galaxy phone. He is a power user of Salesforce and Excel, comfortable with complex workflows and data manipulation. He is enthusiastic about AI tools that can reduce his manual workload but insists on retaining full control over what reaches Salesforce. He values efficiency and will readily adopt tools that demonstrably reduce his workload.",
        { h2: "3.4 Design Implications" },
        "LAT must provide Joseph with an efficient review interface that allows rapid approval, modification, or rejection of AI-generated suggestions. The interface must support keyboard shortcuts for power users and must clearly surface the source evidence for each suggestion. The system must provide visibility into team activity and capture quality metrics, enabling Joseph to coach his team effectively.",
      ]),
      ...sect("4. Persona: LAT Working Group Member", [
        { h2: "4.1 Profile" },
        Neema = "Neema is 31 years old and serves as a LAT Working Group Member in Tanzania. She holds a diploma in community development and has six years of field experience. She conducts approximately fifteen lender visits per month, travelling extensively within her assigned region. She reports to the Country Manager and works independently for most of her time.",
        { h2: "4.2 Goals and Frustrations" },
        "Neema's primary goals are to capture complete and accurate information during lender visits, to minimise administrative overhead, and to maintain strong relationships with lender institution staff. Her frustrations include the time spent on post-visit documentation, the difficulty of capturing voice memos in noisy field conditions, and the unreliability of mobile connectivity in her region. She is also frustrated by the duplication of effort between her field notes and Salesforce data entry.",
        { h2: "4.3 Technology Context" },
        "Neema uses a mid-range Tecno Android phone as her primary device, supplemented by a shared office desktop for documentation. She is comfortable with WhatsApp, mobile banking apps, and basic office productivity tools. She has limited patience for tools that are slow, require extensive typing, or do not work reliably in offline conditions. She is enthusiastic about AI tools that can reduce her documentation burden but is sceptical of their accuracy in her specific context.",
        { h2: "4.4 Design Implications" },
        "LAT must provide Neema with a mobile-first capture interface optimised for one-handed operation on a mid-range Android device. The interface must function fully offline and synchronise automatically when connectivity returns. Voice memo capture must work in noisy conditions and the AI transcription must handle Swahili-English code-switching accurately. The interface must minimise typing through smart defaults, voice input, and structured selection options.",
      ]),
      ...sect("5. Persona: HQ Analyst", [
        { h2: "5.1 Profile" },
        "David is 35 years old and serves as HQ Analyst based at the Aceli regional office. He holds a master's degree in development economics and has seven years of experience in programme analytics. He is responsible for cross-country data analysis, benchmarking, and donor reporting. He works primarily with Salesforce exports, Excel, and Power BI.",
        { h2: "5.2 Goals and Frustrations" },
        "David's primary goals are to produce accurate and timely cross-country analysis, to identify trends and insights that inform programme decisions, and to support donor reporting requirements. His frustrations include the variable data quality across countries, the difficulty of reconciling different data structures, and the time spent on data cleaning rather than analysis. He is also frustrated by the lack of qualitative context in the structured Salesforce data.",
        { h2: "5.3 Technology Context" },
        "David uses a high-spec Lenovo laptop with dual monitors. He is a power user of Excel, Power BI, and Salesforce reporting, with intermediate SQL skills. He is comfortable with statistical analysis tools but is sceptical of black-box AI tools that he cannot audit or reproduce.",
        { h2: "5.4 Design Implications" },
        "LAT must provide David with reliable, consistent data across countries through standardised extraction and review workflows. The system must retain the qualitative context captured in voice memos and visit notes alongside the structured fields, accessible through both the LAT interface and Salesforce reports. The audit trail must be complete enough to support reproducible analysis and donor audit requirements.",
      ]),
    ],
  },
  {
    file: "Aceli_LAT_Initial_User_Story_Catalogue.docx",
    title: "Initial User Story Catalogue",
    subtitle: "Aceli LAT — Sprint 1 Discovery",
    meta: ["Version: 1.0  |  Sprint 1", "Date: February 2026", "Classification: Confidential"],
    sections: [
      ...sect("1. Catalogue Purpose", [
        "The Initial User Story Catalogue captures the user-facing requirements for the Aceli LAT platform in the form of structured user stories. The catalogue is the bridge between the high-level product requirements documented in the PRD and the detailed functional requirements documented in the FRS. Each user story follows the standard format: As a [role], I want [capability], so that [benefit]. The catalogue is organised by user persona and prioritised using the MoSCoW method (Must, Should, Could, Won't).",
        "The catalogue is initial in the sense that it will be refined and extended through Sprint 2 design activities and through ongoing discovery throughout the build sprints. User stories will be added, modified, split, merged, or removed as understanding deepens. The prioritisation will be re-validated at each sprint boundary. The catalogue is the authoritative source for backlog grooming and sprint planning throughout the engagement.",
      ]),
      ...sect("2. Country Director User Stories", [
        { bullets: [
          "As a Country Director, I want to see a dashboard showing the current status of all active lender engagements in my country, so that I can maintain strategic oversight of the portfolio.",
          "As a Country Director, I want to see AI extraction quality metrics for my country, so that I can assess whether the AI tools are performing reliably.",
          "As a Country Director, I want to drill down from the dashboard into individual lender records, so that I can investigate specific engagements in detail.",
          "As a Country Director, I want to see the recent field activity of my team, so that I can assess team performance and identify coaching opportunities.",
          "As a Country Director, I want to filter the dashboard by lender status, engagement tier, and recent activity, so that I can focus on the most relevant engagements.",
        ]},
      ]),
      ...sect("3. Country Manager User Stories", [
        { bullets: [
          "As a Country Manager, I want to see a queue of AI-generated suggestions awaiting review, so that I can efficiently process them before Salesforce write-back.",
          "As a Country Manager, I want to see the source evidence (audio, photo, notes) for each AI suggestion, so that I can validate the suggestion against the original capture.",
          "As a Country Manager, I want to modify AI suggestions before approving them, so that I can correct any extraction errors.",
          "As a Country Manager, I want to reject AI suggestions with a rationale, so that the extraction quality can be improved over time.",
          "As a Country Manager, I want to see the audit trail of all review decisions, so that I can demonstrate data integrity to auditors.",
          "As a Country Manager, I want to monitor the field activity of my team members, so that I can identify coaching opportunities and capacity constraints.",
        ]},
      ]),
      ...sect("4. LAT Working Group Member User Stories", [
        { bullets: [
          "As a Working Group Member, I want to capture visit notes on my phone during lender visits, so that I do not have to rely on handwritten notes.",
          "As a Working Group Member, I want to capture voice memos during visits, so that I can record detailed observations without typing.",
          "As a Working Group Member, I want to capture photographs of relevant documents, so that I have a permanent record of source materials.",
          "As a Working Group Member, I want the capture interface to work fully offline, so that I can capture data in areas without connectivity.",
          "As a Working Group Member, I want the system to automatically synchronise captured data when connectivity returns, so that I do not have to manually manage uploads.",
          "As a Working Group Member, I want to see my upcoming scheduled visits and pre-visit context, so that I can prepare effectively for each visit.",
          "As a Working Group Member, I want the capture interface to support Swahili input, so that I can capture notes in the language of the conversation.",
        ]},
      ]),
      ...sect("5. HQ Analyst User Stories", [
        { bullets: [
          "As an HQ Analyst, I want to extract cross-country engagement data in a standardised format, so that I can perform reliable benchmarking.",
          "As an HQ Analyst, I want to access the qualitative context (voice memos, visit notes) alongside structured fields, so that I can enrich my analysis with narrative insight.",
          "As an HQ Analyst, I want to access the full audit trail of review decisions, so that I can demonstrate data integrity to auditors and donors.",
          "As an HQ Analyst, I want to filter engagement data by country, lender tier, and time period, so that I can produce targeted analysis for different audiences.",
        ]},
      ]),
      ...sect("6. Prioritisation Summary", [
        "The user stories in this catalogue have been prioritised using the MoSCoW method. Must-have stories are essential for Wave 1 rollout and must be delivered before the platform can be considered production-ready. Should-have stories are important but can be deferred to a later release if necessary. Could-have stories are desirable but not essential, and will be delivered if time and budget permit. Won't-have stories are explicitly out of scope for Wave 1 but may be considered for Wave 2.",
        "The Must-have category includes all field capture functionality (visit notes, voice memos, photographs, offline capability, synchronisation), the core review workflow (queue, source evidence, approve/modify/reject), the basic Salesforce integration (lender and visit object sync), and the Country Director dashboard. The Should-have category includes advanced filtering, team performance monitoring, and cross-country benchmarking. The Could-have category includes predictive analytics, automated coaching recommendations, and advanced reporting templates. The Won't-have category includes Wave 2 country support, Salesforce schema extensions, and third-party data enrichment.",
      ]),
    ],
  },
  {
    file: "Aceli_LAT_Baseline_Measurement_Plan.docx",
    title: "Baseline Measurement Plan",
    subtitle: "Aceli LAT — Sprint 1 Discovery",
    meta: ["Version: 1.0  |  Sprint 1", "Date: February 2026", "Classification: Confidential"],
    sections: [
      ...sect("1. Purpose and Scope", [
        "The Baseline Measurement Plan establishes the pre-LAT baseline against which the impact of the LAT deployment will be measured. The plan defines the metrics to be tracked, the data sources for each metric, the measurement methodology, and the reporting cadence. The baseline will be established through a combination of Salesforce data extraction, field staff surveys, and direct observation across the five Wave 1 countries during Sprint 1. The baseline values will be documented in the Baseline Evidence Capture Template and will be referenced throughout the engagement to measure LAT's impact.",
        "The scope of the baseline covers the lender engagement workflow end-to-end, from initial targeting through reporting and analytics. The baseline focuses on the operational metrics that LAT is designed to improve, including reconciliation time, data completeness, field productivity, and data quality. The baseline does not cover programme outcomes such as lending volume or institutional strengthening, which are tracked through separate Aceli programme monitoring and evaluation activities.",
      ]),
      ...sect("2. Metric Framework", [
        "The metric framework comprises four categories: efficiency metrics, quality metrics, productivity metrics, and user experience metrics. Efficiency metrics measure the time and effort required to complete workflow activities. Quality metrics measure the accuracy and completeness of captured data. Productivity metrics measure the throughput of field activity. User experience metrics measure the satisfaction and effectiveness of users interacting with the workflow. Each metric has a defined calculation methodology, data source, measurement frequency, and target improvement.",
        { h2: "2.1 Efficiency Metrics" },
        "Efficiency metrics capture the time and effort required to complete the workflow activities that LAT is designed to streamline. The primary efficiency metrics are reconciliation time (time from field visit to Salesforce update), documentation time (time spent on post-visit documentation), and review time (time spent by Country Managers on review activities). The baseline reconciliation time is currently estimated at five to fourteen days based on preliminary interviews, with a target reduction of at least sixty percent.",
        { h2: "2.2 Quality Metrics" },
        "Quality metrics capture the accuracy and completeness of captured data. The primary quality metrics are data completeness (percentage of visits with complete structured data), data accuracy (percentage of Salesforce records matching source evidence), and voice memo capture rate (percentage of visits with voice memos captured). The baseline data completeness is currently estimated at approximately forty-five percent based on Salesforce sampling, with a target improvement to at least eighty-five percent.",
        { h2: "2.3 Productivity Metrics" },
        "Productivity metrics capture the throughput of field activity. The primary productivity metrics are visits per Working Group Member per month, percentage of working time spent on field activity versus documentation, and percentage of scheduled visits completed. The baseline visits per member per month is currently approximately fifteen based on Salesforce data, with a target of maintaining or increasing this rate while reducing documentation burden.",
        { h2: "2.4 User Experience Metrics" },
        "User experience metrics capture the satisfaction and effectiveness of users interacting with the workflow. The primary UX metrics are the System Usability Scale score, the Net Promoter Score for the LAT platform, and the percentage of users who would recommend LAT to colleagues. The baseline SUS will be measured for the current workflow as a reference point, with a target LAT SUS score of at least seventy-five.",
      ]),
      ...sect("3. Measurement Methodology", [
        "The baseline measurement will be conducted through three complementary methods: Salesforce data extraction, field staff surveys, and direct observation. Salesforce data extraction provides the quantitative baseline for efficiency, quality, and productivity metrics, drawing on the historical Salesforce data for the six months prior to baseline measurement. Field staff surveys provide the self-reported baseline for user experience metrics and contextual information for the quantitative metrics. Direct observation provides validation of the self-reported data and captures qualitative context that surveys cannot.",
        "Salesforce data extraction will be performed by the HQ Analytics team using established reporting tools, with extraction queries defined in the Baseline Evidence Capture Template. Field staff surveys will be administered online to all LAT Working Group Members, Country Managers, and Country Directors across the five Wave 1 countries, with a target response rate of at least eighty percent. Direct observation will be conducted by the Field Research Lead through site visits to each of the five countries, with at least three visits shadowed per country.",
      ]),
      ...sect("4. Reporting and Review", [
        "Baseline measurement results will be documented in the Baseline Evidence Capture Template and reviewed in a baseline validation workshop with the Programme Director, Country Directors, and HQ Analytics team. The validated baseline will be referenced throughout the engagement in sprint review packs and will form the comparison point for the Sprint 7 Pilot KPI Validation Report. Progress against baseline will be reported monthly to the steering committee and quarterly to the donor consortium.",
      ]),
    ],
  },
  {
    file: "Aceli_LAT_Baseline_Evidence_Capture_Template.docx",
    title: "Baseline Evidence Capture Template",
    subtitle: "Aceli LAT — Sprint 1 Discovery",
    meta: ["Version: 1.0  |  Sprint 1", "Date: February 2026", "Classification: Confidential"],
    sections: [
      ...sect("1. Template Purpose", [
        "The Baseline Evidence Capture Template provides a structured format for recording the baseline values for each metric defined in the Baseline Measurement Plan. The template ensures consistency across countries and metrics, supports audit trail requirements, and provides the comparison point for LAT impact measurement throughout the engagement. The template will be completed by the HQ Analytics team with input from Country Directors and Country Managers, and will be validated through the baseline validation workshop.",
      ]),
      ...sect("2. Metric Capture Format", [
        "Each metric is captured in a standardised format that includes the metric name, metric category, calculation methodology, data source, measurement period, baseline value, baseline sample size, baseline confidence level, and notes. The standardised format ensures that the baseline can be reliably compared against post-LAT measurements and that any measurement methodology changes are explicitly documented.",
        { h2: "2.1 Efficiency Metrics Template" },
        "Efficiency metrics capture time-based measures and are recorded in hours or days as appropriate. The template includes fields for the activity being measured, the start and end points of the measurement, the average time, the median time, the sample size, and any contextual notes that affect interpretation. For example, the reconciliation time metric captures the time from field visit completion to Salesforce record update, with separate fields for the visit date, Salesforce update date, calculated lag in days, and notes on any factors that affected the lag.",
        { h2: "2.2 Quality Metrics Template" },
        "Quality metrics capture accuracy and completeness measures and are recorded as percentages. The template includes fields for the metric definition, the numerator, the denominator, the calculated percentage, the sample size, the sampling methodology, and any notes on data quality issues that affected the measurement. For example, the data completeness metric captures the percentage of visits with all required structured fields populated in Salesforce, with separate fields for the number of visits with complete data, the total number of visits, the calculated percentage, the sampling period, and notes on any data quality issues encountered.",
        { h2: "2.3 Productivity Metrics Template" },
        "Productivity metrics capture throughput measures and are recorded as counts or rates. The template includes fields for the activity being measured, the measurement period, the count or rate, the per-capita normalisation, and notes on any factors that affected the measurement. For example, the visits per Working Group Member per month metric captures the count of visits per member per month, with separate fields for the member identifier, the month, the visit count, and notes on any factors such as leave or training that affected the count.",
        { h2: "2.4 User Experience Metrics Template" },
        "User experience metrics capture satisfaction and effectiveness measures and are recorded as scores on standardised scales. The template includes fields for the metric, the scale used, the respondent identifier, the respondent role, the score, the response date, and any qualitative notes. For example, the System Usability Scale metric captures the SUS score for each respondent, with separate fields for the respondent identifier, the respondent role, the ten individual SUS question responses, the calculated SUS score, the response date, and qualitative notes from the survey.",
      ]),
      ...sect("3. Validation and Sign-off", [
        "The completed Baseline Evidence Capture Template will be reviewed in a baseline validation workshop attended by the Programme Director, Country Directors, HQ Analytics team, and the Z.ai Delivery delivery lead. The workshop will validate the baseline values, confirm the measurement methodology, and document any caveats or limitations. The validated baseline will be signed off by the Programme Director and will form the authoritative baseline against which LAT impact is measured.",
      ]),
    ],
  },
  {
    file: "Aceli_LAT_v0.2.0_Discovery_Release_Notes.docx",
    title: "v0.2.0 Discovery Release Notes",
    subtitle: "Aceli LAT — Sprint 1 Discovery",
    meta: ["Version: 0.2.0  |  Sprint 1", "Date: February 2026", "Classification: Confidential"],
    sections: [
      ...sect("1. Release Overview", [
        "Version 0.2.0 marks the completion of Sprint 1 Discovery activities and the transition into Sprint 2 Architecture and Design. The release comprises the complete set of discovery deliverables that establish the business requirements, product requirements, user personas, current state process map, user story catalogue, and baseline measurement framework for the Aceli LAT production build. All deliverables have been reviewed and accepted by the Aceli Programme Director and Country Directors across the five Wave 1 countries.",
      ]),
      ...sect("2. Deliverables", [
        "The v0.2.0 release includes the following deliverables, each of which has been reviewed and accepted by the named stakeholders. The deliverables form the authoritative basis for the Sprint 2 architecture and design activities and will be referenced throughout the engagement.",
        { bullets: [
          "Business Requirements Document (BRD) — defines the high-level business needs and success criteria.",
          "Product Requirements Document (PRD) — translates business needs into product capabilities and features.",
          "Stakeholder Matrix — identifies all stakeholders and their engagement requirements.",
          "Current State Process Map — documents the as-is lender engagement workflow across all five Wave 1 countries.",
          "User Persona Pack — documents the five primary user personas with profiles, goals, and design implications.",
          "Initial User Story Catalogue — captures user-facing requirements in structured user story format.",
          "Baseline Measurement Plan — defines the metrics, methodology, and reporting cadence for baseline measurement.",
          "Baseline Evidence Capture Template — provides the structured format for recording baseline values.",
        ]},
      ]),
      ...sect("3. Key Decisions", [
        "Several key decisions were made during Sprint 1 that shape the direction of subsequent sprints. These decisions were validated through the sprint review workshop and are recorded here as authoritative for the remainder of the engagement.",
        { numbers: [
          "Wave 1 scope confirmed as five countries: Tanzania, Kenya, Uganda, Rwanda, and Ethiopia.",
          "AI extraction target language confirmed as Swahili-English code-switching with potential country-specific extensions.",
          "Salesforce confirmed as system of record; LAT will not replace or extend Salesforce schema beyond minor field additions.",
          "Human-in-the-loop review confirmed as mandatory; no AI suggestion will reach Salesforce without explicit human approval.",
          "Mobile-first capture interface confirmed as primary field interface; no desktop capture interface for field users.",
          "Offline-first architecture confirmed as essential; field capture must function fully without connectivity.",
        ]},
      ]),
      ...sect("4. Risks and Issues", [
        "Three risks were identified during Sprint 1 that require active management through subsequent sprints. First, the variability of mobile connectivity across the five Wave 1 countries creates a risk that offline synchronisation may be unreliable in some regions. Second, the variability of audio quality in field conditions creates a risk that AI transcription accuracy may fall below the 85% target. Third, the variability of Salesforce data quality across countries creates a risk that LAT's perceived value may be undermined by pre-existing data quality issues. Each risk has been added to the risk register with mitigation activities planned for Sprint 2.",
      ]),
      ...sect("5. Transition to Sprint 2", [
        "Sprint 2 Architecture and Design will commence on 23 February 2026 and will run for four calendar weeks through 20 March 2026. The sprint will produce the Software Requirements Specification, Functional Requirements Specification, Solution Architecture Document, Integration Architecture Document, Non-Functional Requirements Specification, RBAC Matrix, Data Flow Diagrams, Sequence Diagrams, ADR Set, AI Prompt Workflow Specification, Exception Workflow Specification, Salesforce Mapping Specification, and the v0.3.0 Design Sign-off Release Notes. The Sprint 2 design sign-off will trigger the M3 milestone payment representing twenty percent of the total engagement value.",
      ]),
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// Generic doc generator for Sprints 2-7 (compact docs)
// ═══════════════════════════════════════════════════════════

function buildSimpleDoc(folder, file, title, subtitle, version, date, sections) {
  return buildDocFile(folder, file, title, subtitle,
    [`Version: ${version}`, `Date: ${date}`, "Classification: Confidential"],
    `${version}  |  ${subtitle}`,
    sections.flatMap(s => sect(s.h1, s.paragraphs))
  );
}

// Sprint 2 docs — Architecture & Design
const sprint2Docs = [
  { folder: "sprint2", file: "Aceli_LAT_SRS_v1.docx", title: "Software Requirements Specification", subtitle: "Aceli LAT — Sprint 2 Architecture",
    sections: [
      { h1: "1. Introduction", paragraphs: [
        "The Software Requirements Specification (SRS) documents the complete software requirements for the Aceli Lender Activation Tool (LAT) platform. The SRS translates the business and product requirements captured in Sprint 1 into specific, testable software requirements that govern the engineering build in Sprints 3 through 7. The document covers functional requirements, non-functional requirements, interface requirements, and data requirements, and serves as the authoritative requirements reference for the engineering team throughout the build.",
        "This SRS follows the IEEE 830 standard structure and is intended for multiple audiences: engineering teams use it as the build reference, QA teams use it as the test planning basis, project management uses it for scope management, and stakeholders use it for acceptance validation. The requirements are uniquely numbered and traceable to the user stories in the Initial User Story Catalogue and to the business requirements in the BRD through the Requirements Traceability Matrix.",
      ]},
      { h1: "2. Functional Requirements", paragraphs: [
        "The functional requirements define the specific behaviours and capabilities that the LAT platform must provide. Each requirement is uniquely identified, prioritised, and traceable to one or more user stories. The requirements are grouped by functional area and are written in shall-statement format to support test planning and acceptance validation.",
        { h2: "2.1 Field Capture Requirements" },
        "The field capture subsystem provides the mobile-first interface used by LAT Working Group Members during lender visits. The subsystem must support capture of visit notes, voice memos, photographs, and structured metadata, with full offline capability and automatic synchronisation. The capture workflow must be completable within five minutes per visit on a mid-range Android device, with all captured data persisted locally until synchronisation.",
        { h2: "2.2 AI Extraction Requirements" },
        "The AI extraction subsystem processes captured voice memos and visit notes to produce structured intelligence fields. The subsystem must support Swahili-English code-switching in transcription, must extract a defined set of intelligence fields including institution name, contact information, follow-up actions, and risk indicators, and must produce confidence scores for each extracted field. The extraction must complete within sixty seconds for a typical five-minute voice memo.",
        { h2: "2.3 Review Workflow Requirements" },
        "The review workflow subsystem provides Country Managers with an interface for reviewing AI-generated suggestions before Salesforce write-back. The subsystem must present the original source evidence alongside the extracted fields, must support approve, modify, and reject actions on each field independently, and must maintain a complete audit trail of all review decisions. The interface must support keyboard shortcuts for power users and must process at least twenty suggestions per hour under normal use.",
        { h2: "2.4 Salesforce Integration Requirements" },
        "The Salesforce integration subsystem provides bidirectional synchronisation between LAT and Salesforce. The subsystem must respect Salesforce API rate limits, must implement conflict resolution protocols for concurrent updates, must maintain a complete audit trail of all synchronisation events, and must complete synchronisation of a single record within thirty seconds under normal network conditions.",
        { h2: "2.5 Dashboard and Reporting Requirements" },
        "The dashboard and reporting subsystem provides Country Directors and HQ Analysts with visibility into field activity, AI quality, and reconciliation status. The dashboard must load within three seconds, must support drill-down from summary metrics to individual records, and must provide filtering by country, lender, time period, and engagement tier. The dashboard must refresh data at least every five minutes from the underlying database.",
      ]},
      { h1: "3. Non-Functional Requirements", paragraphs: [
        "The non-functional requirements govern the performance, reliability, security, and operational characteristics of the LAT platform. These requirements are detailed in the Non-Functional Requirements Specification deliverable and are summarised here for software context. The non-functional requirements are testable and will be validated through the Sprint 6 performance and security testing activities.",
        { bullets: [
          "Performance: 95th percentile page load time under 3 seconds; AI transcription under 60 seconds for typical input.",
          "Reliability: 99.5% uptime during business hours; offline capture must function indefinitely without network.",
          "Security: AES-256 encryption at rest; TLS 1.3 in transit; role-based access control; 7-year audit trail retention.",
          "Usability: System Usability Scale score of 75+; field capture completable in 5 minutes per visit.",
          "Scalability: Support 200 concurrent users across 5 countries; support 10,000 lender records.",
          "Maintainability: 80%+ unit test coverage; all code peer-reviewed; CI/CD pipeline with automated quality gates.",
        ]},
      ]},
      { h1: "4. Interface Requirements", paragraphs: [
        "The LAT platform interfaces with several external systems through defined APIs. Each interface has specific requirements for protocol, data format, authentication, error handling, and rate limiting. The interface requirements are detailed in the Integration Architecture Document and the API Contracts deliverables.",
        { bullets: [
          "Salesforce REST API: bidirectional synchronisation of lender and visit objects; OAuth 2.0 authentication; rate limit compliance.",
          "OpenAI API: Claude/GPT-4-class models for transcription and extraction; API key authentication; usage monitoring.",
          "Anthropic API: Claude models as fallback for OpenAI; API key authentication; usage monitoring.",
          "Twilio API: SMS notifications for visit reminders and review queue updates; API key authentication.",
          "Cloudflare R2: object storage for photographs and voice memos; S3-compatible API; access key authentication.",
        ]},
      ]},
    ] },
];

// Sprint 3-7 docs — generated compactly
const compactSprints = [
  // Sprint 3
  { folder: "sprint3", version: "v0.4.0", sprintName: "Foundation Build & DevSecOps", date: "April 2026",
    docs: [
      ["Aceli_LAT_Engineering_Standards_Guide.docx", "Engineering Standards Guide", "The Engineering Standards Guide establishes the coding standards, review processes, and quality gates that govern all engineering work on the Aceli LAT platform. The guide covers TypeScript and React conventions, Prisma schema patterns, API route conventions, testing requirements, and code review protocols. Adherence to the guide is enforced through automated linting, type checking, and CI/CD quality gates, with deviations requiring explicit architect approval documented in the ADR set."],
      ["Aceli_LAT_API_Standards_Guide.docx", "API Standards Guide", "The API Standards Guide defines the conventions for designing, documenting, and versioning the internal and external APIs of the LAT platform. The guide covers REST endpoint naming, request and response schemas, error handling, pagination, authentication, rate limiting, and OpenAPI documentation requirements. All APIs must conform to the guide and must be documented in the OpenAPI specification that is automatically generated and published with each release."],
      ["Aceli_LAT_CICD_Guide.docx", "CI/CD Guide", "The CI/CD Guide documents the continuous integration and continuous deployment pipeline that governs all code changes on the LAT platform. The pipeline runs on GitHub Actions and includes linting, type checking, unit testing, integration testing, security scanning, build, and deploy stages. The guide defines the branching strategy, release process, rollback procedures, and environment promotion gates that ensure code quality and deployment reliability."],
      ["Aceli_LAT_DevSecOps_Runbook.docx", "DevSecOps Runbook", "The DevSecOps Runbook documents the operational procedures for maintaining the LAT platform in production. The runbook covers incident response, deployment procedures, monitoring and alerting, security incident handling, backup and recovery, and capacity management. The runbook is the authoritative operational reference for the platform team and is reviewed and updated at each sprint boundary."],
      ["Aceli_LAT_Environment_Provisioning_Guide.docx", "Environment Provisioning Guide", "The Environment Provisioning Guide documents the process for creating and managing the development, staging, and production environments for the LAT platform. The guide covers Neon PostgreSQL provisioning, Vercel deployment configuration, environment variable management, secret management, and access control. All environments are provisioned through infrastructure-as-code using Terraform, with manual provisioning prohibited."],
      ["Aceli_LAT_Logging_and_Observability_Guide.docx", "Logging and Observability Guide", "The Logging and Observability Guide defines the logging, metrics, and tracing standards for the LAT platform. The guide covers structured logging conventions, metric naming and labelling, distributed tracing, alerting rules, and dashboard requirements. The platform uses Datadog for observability, with all services emitting standardised telemetry that supports real-time monitoring and historical analysis."],
      ["Aceli_LAT_Release_Management_SOP.docx", "Release Management Standard Operating Procedure", "The Release Management SOP documents the process for planning, executing, and verifying releases of the LAT platform. The SOP covers release planning, release candidate creation, staging validation, production deployment, post-deployment verification, and rollback procedures. The SOP is the authoritative release reference for the engineering and operations teams and is reviewed at each sprint boundary."],
      ["Aceli_LAT_ADR_Updates_Sprint3.docx", "ADR Updates — Sprint 3", "This document records the Architecture Decision Record updates made during Sprint 3 Foundation Build. The updates cover decisions on CI/CD tooling selection, environment provisioning approach, observability stack, logging conventions, and security baseline. Each ADR documents the context, decision, consequences, and compliance considerations, and is referenced from the main ADR set maintained as a living document throughout the engagement."],
      ["Aceli_LAT_v0.4.0_Foundation_Release_Notes.docx", "v0.4.0 Foundation Release Notes", "Version 0.4.0 marks the completion of Sprint 3 Foundation Build and DevSecOps activities. The release comprises the complete engineering foundation that enables the build sprints to follow, including the CI/CD pipeline, environment provisioning, observability stack, and engineering standards. The foundation has been validated through the deployment of a stub application to staging with full pipeline execution, demonstrating that the engineering workflow is operational and ready to support the build of production features in Sprints 4 and 5."],
    ],
  },
  // Sprint 4
  { folder: "sprint4", version: "v0.5.0", sprintName: "Capture & AI Draft Build", date: "May 2026",
    docs: [
      ["Aceli_LAT_Capture_Module_Design_Doc.docx", "Capture Module Design Document", "The Capture Module Design Document specifies the architecture and implementation of the field capture subsystem that LAT Working Group Members use during lender visits. The module provides mobile-first capture of visit notes, voice memos, photographs, and structured metadata, with full offline capability and automatic synchronisation. The design covers the client-side state management, the local persistence layer using IndexedDB, the synchronisation engine, and the conflict resolution protocols."],
      ["Aceli_LAT_Transcription_Extraction_Design_Doc.docx", "Transcription and Extraction Design Document", "The Transcription and Extraction Design Document specifies the architecture and implementation of the AI-powered transcription and field extraction pipeline. The pipeline processes captured voice memos using OpenAI's Whisper or Anthropic's Claude for transcription, then extracts structured intelligence fields using Claude. The design covers the prompt engineering, the confidence scoring mechanism, the fallback strategy for low-confidence extractions, and the human-in-the-loop review queue integration."],
      ["Aceli_LAT_Offline_Drafting_Spec.docx", "Offline Drafting Specification", "The Offline Drafting Specification defines the behaviour of the LAT capture interface when operating without network connectivity. The specification covers local data persistence using IndexedDB, conflict detection and resolution when synchronising with the server, queue management for pending uploads, and the user experience for offline state indication. The specification ensures that field workers can capture data reliably regardless of connectivity, with synchronisation occurring automatically when connectivity returns."],
      ["Aceli_LAT_Field_UX_Guide_v1.docx", "Field UX Guide v1", "The Field UX Guide documents the user experience design for the LAT field capture interface. The guide covers the information architecture, the navigation patterns, the form design conventions, the accessibility requirements, and the interaction design for one-handed mobile operation. The guide is informed by the User Persona Pack and the Current State Process Map from Sprint 1 and has been validated through field UX testing in Sprint 4."],
      ["Aceli_LAT_AI_Confidence_Review_Policy.docx", "AI Confidence Review Policy", "The AI Confidence Review Policy defines the rules governing when AI-generated suggestions require human review before Salesforce write-back. The policy specifies confidence thresholds for automatic approval, mandatory review, and automatic rejection, with field-specific overrides for high-impact fields. The policy also defines the feedback loop whereby reviewer decisions are used to improve AI extraction quality over time."],
      ["Aceli_LAT_API_Contracts_v1.docx", "API Contracts v1", "The API Contracts document specifies the version 1 contracts for all internal and external APIs of the LAT platform. The contracts cover the field capture API, the AI extraction API, the review workflow API, the Salesforce sync API, and the dashboard API. Each contract specifies the endpoint, request schema, response schema, error codes, authentication requirements, and rate limits, and is published as an OpenAPI specification."],
      ["Aceli_LAT_Activation_Area_Mapping_Guide.docx", "Activation Area Mapping Guide", "The Activation Area Mapping Guide documents the mapping between Aceli's activation area framework and the LAT data model. The guide covers how activation area identifiers are stored, how they are used for filtering and aggregation in dashboards, and how they relate to the lender and visit objects in Salesforce. The guide ensures consistent use of activation area references across all LAT functionality."],
      ["Aceli_LAT_v0.5.0_Capture_AI_Draft_Release_Notes.docx", "v0.5.0 Capture AI Draft Release Notes", "Version 0.5.0 marks the completion of Sprint 4 Capture and AI Draft Build activities. The release comprises the capture module, the AI transcription and extraction pipeline, the offline drafting capability, and the field UX. The release is in beta status and has been validated through internal testing and a one-week field UX validation visit. The release triggers the M5 milestone payment representing fifteen percent of the total engagement value."],
    ],
  },
  // Sprint 5
  { folder: "sprint5", version: "v0.6.0", sprintName: "Review, Sync & Governance Build", date: "May 2026",
    docs: [
      ["Aceli_LAT_Review_Workflow_Spec.docx", "Review Workflow Specification", "The Review Workflow Specification defines the behaviour of the human-in-the-loop review subsystem that Country Managers use to validate AI-generated suggestions before Salesforce write-back. The specification covers the review queue management, the source evidence presentation, the approve/modify/reject actions, the bulk operations, and the audit trail capture. The specification ensures that no AI suggestion reaches Salesforce without explicit human review, maintaining data integrity and accountability."],
      ["Aceli_LAT_Exception_Handling_Spec.docx", "Exception Handling Specification", "The Exception Handling Specification defines the behaviour of the LAT platform when exceptional conditions occur during capture, extraction, review, or synchronisation. The specification covers network failures, AI service failures, Salesforce API failures, validation failures, and conflict resolution. Each exception type has defined detection, reporting, recovery, and escalation procedures, ensuring that the platform degrades gracefully under adverse conditions."],
      ["Aceli_LAT_Salesforce_Sync_Spec_v1.docx", "Salesforce Sync Specification v1", "The Salesforce Sync Specification defines the bidirectional synchronisation between LAT and Salesforce. The specification covers the object mappings, the field mappings, the synchronisation triggers, the conflict resolution protocols, the rate limit compliance, and the audit trail. The specification ensures that LAT respects Salesforce as the system of record while providing the bidirectional data flow required for the field capture workflow."],
      ["Aceli_LAT_Data_Validation_Rules_Catalogue.docx", "Data Validation Rules Catalogue", "The Data Validation Rules Catalogue documents all validation rules applied to data captured and processed by the LAT platform. The catalogue covers field-level validations, cross-field validations, business rule validations, and Salesforce constraint validations. Each rule is uniquely identified, documented with its purpose, logic, error message, and remediation guidance, and is enforced at the capture, review, and synchronisation layers as appropriate."],
      ["Aceli_LAT_Audit_Trail_Specification.docx", "Audit Trail Specification", "The Audit Trail Specification defines the comprehensive audit trail that the LAT platform maintains for all data and decision events. The specification covers the events captured, the metadata recorded for each event, the storage and retention requirements, and the query and reporting interfaces. The audit trail meets the seven-year retention requirement and supports donor audit and regulatory compliance requirements."],
      ["Aceli_LAT_Reviewer_SOP.docx", "Reviewer Standard Operating Procedure", "The Reviewer SOP documents the standard operating procedure that Country Managers follow when reviewing AI-generated suggestions in the LAT platform. The SOP covers the review queue prioritisation, the source evidence review process, the approve/modify/reject decision criteria, the bulk operations, and the escalation procedures. The SOP is the authoritative operational reference for the review function and is used as the basis for reviewer training."],
      ["Aceli_LAT_Updated_FRS_SRS.docx", "Updated FRS/SRS — Sprint 5", "This document records the updates to the Functional Requirements Specification and Software Requirements Specification made during Sprint 5 Review, Sync and Governance Build. The updates reflect the detailed design of the review workflow, exception handling, Salesforce synchronisation, data validation, and audit trail subsystems, and incorporate the API contracts and validation rules defined during the sprint. The updated specifications are the authoritative requirements reference for the Sprint 6 validation activities."],
      ["Aceli_LAT_v0.6.0_Review_Sync_Governance_Release_Notes.docx", "v0.6.0 Review Sync Governance Release Notes", "Version 0.6.0 marks the completion of Sprint 5 Review, Sync and Governance Build activities. The release comprises the review workflow, the exception handling framework, the Salesforce bidirectional sync, the data validation rules, the audit trail, and the reviewer SOP. The release is in beta status and has been validated through internal testing and Salesforce sandbox integration testing. The release triggers the M6 milestone payment representing ten percent of the total engagement value."],
    ],
  },
  // Sprint 7
  { folder: "sprint7", version: "v1.1.0", sprintName: "Rollout Wave 1 & Hypercare", date: "July 2026",
    docs: [
      ["Aceli_LAT_Rollout_Wave1_Plan.docx", "Rollout Wave 1 Plan", "The Rollout Wave 1 Plan documents the deployment strategy for taking the LAT platform live in the five Wave 1 countries. The plan covers the rollout sequence, the country-specific configuration, the user communication and training plan, the support model, and the success criteria. The plan adopts a staggered rollout approach starting with Tanzania as the lead country, followed by Kenya, Uganda, Rwanda, and Ethiopia at two-week intervals, allowing learnings from each country to inform subsequent rollouts."],
      ["Aceli_LAT_Hypercare_SOP.docx", "Hypercare Standard Operating Procedure", "The Hypercare SOP documents the standard operating procedure for the hypercare period following Wave 1 rollout. The SOP covers the support model with extended hours coverage, the incident severity classification and response times, the escalation procedures, the daily standup and issue triage process, and the transition to steady-state operations. The hypercare period runs for thirty days from each country's go-live and provides the intensive support required to ensure smooth adoption."],
      ["Aceli_LAT_Country_Configuration_Checklist.docx", "Country Configuration Checklist", "The Country Configuration Checklist documents the configuration items that must be completed for each country before go-live. The checklist covers Salesforce configuration, language and locale settings, activation area mappings, user account provisioning, role assignments, training completion verification, and pilot user readiness confirmation. Each country must complete the checklist with sign-off from the Country Director and the Z.ai Delivery lead before go-live is authorised."],
      ["Aceli_LAT_Country_Training_Pack.docx", "Country Training Pack", "The Country Training Pack documents the training materials and delivery plan for each Wave 1 country. The pack covers the training curriculum for LAT Working Group Members, Country Managers, and Country Directors, the training delivery schedule, the hands-on exercise materials, the assessment criteria, and the post-training support plan. The training is delivered in-country by the Change and Training Lead with support from the Field Research Lead."],
      ["Aceli_LAT_Pilot_KPI_Validation_Report.docx", "Pilot KPI Validation Report", "The Pilot KPI Validation Report documents the validation of the LAT pilot against the baseline metrics established in Sprint 1. The report covers each metric in the Baseline Measurement Plan, comparing the pilot performance against the baseline and against the target improvement. The report is the authoritative artefact for assessing LAT's impact and triggers the M8 milestone payment representing ten percent of the total engagement value upon acceptance."],
      ["Aceli_LAT_Defect_Triage_Report.docx", "Defect Triage Report", "The Defect Triage Report documents the defects identified during Sprint 6 UAT and Sprint 7 hypercare, and their resolution status. The report covers the defect severity classification, the triage process, the resolution prioritisation, the fix verification, and the residual known issues. The report demonstrates that all critical and high-severity defects have been resolved before go-live and that residual known issues have documented workarounds and remediation plans."],
      ["Aceli_LAT_Updated_FRS_SRS_Sprint7.docx", "Updated FRS/SRS — Sprint 7", "This document records the final updates to the Functional Requirements Specification and Software Requirements Specification made during Sprint 7 Rollout Wave 1 and Hypercare. The updates reflect the production deployment configuration, the country-specific extensions, the operational runbooks, and any minor requirement changes identified during hypercare. The updated specifications are the authoritative requirements reference for the production platform and form the baseline for any future enhancements."],
      ["Aceli_LAT_v1.1.0_Rollout_Wave1_Release_Notes.docx", "v1.1.0 Rollout Wave 1 Release Notes", "Version 1.1.0 marks the completion of Sprint 7 Rollout Wave 1 and Hypercare activities and the closure of the LAT production build engagement. The release comprises the Wave 1 rollout across all five countries, the hypercare period, the pilot KPI validation, the defect triage, and the updated FRS/SRS. The release is in production status and has been validated through the pilot KPI validation report. The release triggers the M8 milestone payment representing ten percent of the total engagement value and concludes the engagement."],
    ],
  },
];

// Sprint 2 — add a few more docs
const sprint2Extra = [
  { file: "Aceli_LAT_FRS_v1.docx", title: "Functional Requirements Specification", subtitle: "Aceli LAT — Sprint 2 Architecture",
    sections: [
      { h1: "1. Introduction", paragraphs: [
        "The Functional Requirements Specification (FRS) translates the software requirements documented in the SRS into specific functional requirements organised by feature area. Each functional requirement is uniquely identified, prioritised, and traceable to one or more software requirements and user stories. The FRS is the authoritative functional reference for the engineering build and the QA test planning.",
      ]},
      { h1: "2. Field Capture Functional Requirements", paragraphs: [
        "The field capture subsystem provides the mobile-first interface used by LAT Working Group Members during lender visits. The subsystem supports capture of visit notes, voice memos, photographs, and structured metadata, with full offline capability and automatic synchronisation. The functional requirements below define the specific behaviours expected of the subsystem.",
        { bullets: [
          "FR-CAP-001: The system shall provide a mobile-first capture interface accessible on mid-range Android devices.",
          "FR-CAP-002: The system shall support capture of visit notes in text format with Swahili and English input.",
          "FR-CAP-003: The system shall support capture of voice memos up to 30 minutes in length.",
          "FR-CAP-004: The system shall support capture of photographs up to 10MB each.",
          "FR-CAP-005: The system shall function fully offline and synchronise automatically when connectivity returns.",
          "FR-CAP-006: The system shall persist captured data locally using IndexedDB with at least 100MB capacity.",
        ]},
      ]},
      { h1: "3. AI Extraction Functional Requirements", paragraphs: [
        "The AI extraction subsystem processes captured voice memos and visit notes to produce structured intelligence fields. The subsystem uses OpenAI and Anthropic models for transcription and extraction, with confidence scoring and human-in-the-loop review.",
        { bullets: [
          "FR-AI-001: The system shall transcribe voice memos using OpenAI Whisper or Anthropic Claude.",
          "FR-AI-002: The system shall support Swahili-English code-switching in transcription.",
          "FR-AI-003: The system shall extract institution name, contact information, follow-up actions, and risk indicators.",
          "FR-AI-004: The system shall produce confidence scores for each extracted field on a 0-100 scale.",
          "FR-AI-005: The system shall complete transcription within 60 seconds for a typical 5-minute voice memo.",
          "FR-AI-006: The system shall queue all extractions for human review before any Salesforce write-back.",
        ]},
      ]},
    ] },
  { file: "Aceli_LAT_Solution_Architecture_Document.docx", title: "Solution Architecture Document", subtitle: "Aceli LAT — Sprint 2 Architecture",
    sections: [
      { h1: "1. Architecture Overview", paragraphs: [
        "The Solution Architecture Document describes the overall architecture of the Aceli LAT platform. The architecture follows a serverless-first approach with Next.js 16 deployed on Vercel, Neon PostgreSQL as the primary database, and integration with Salesforce as the system of record. The architecture is designed for the five Wave 1 countries with horizontal scalability to support future Wave 2 expansion.",
        "The architecture comprises four primary layers: the client layer comprising the Next.js web application optimised for mobile use, the application layer comprising Next.js API routes and server actions, the data layer comprising Neon PostgreSQL and Cloudflare R2 object storage, and the integration layer comprising Salesforce, OpenAI, Anthropic, and Twilio APIs. Each layer has defined responsibilities and interfaces, and the layers communicate through well-documented contracts.",
      ]},
      { h1: "2. Component Architecture", paragraphs: [
        "The component architecture decomposes the platform into functional components with defined responsibilities. The components include the Capture Component, the AI Extraction Component, the Review Workflow Component, the Salesforce Sync Component, the Dashboard Component, and the shared Platform Services Component. Each component is implemented as a set of Next.js API routes and React server components, with shared types and utilities provided by the Platform Services Component.",
      ]},
      { h1: "3. Data Architecture", paragraphs: [
        "The data architecture defines the data model, storage, and flow for the LAT platform. The primary database is Neon PostgreSQL accessed through Prisma ORM, with the schema covering lenders, visits, captures, extractions, reviews, and audit events. Binary assets including photographs and voice memos are stored in Cloudflare R2 object storage with metadata in PostgreSQL. Salesforce is the system of record for lender and visit objects, with LAT maintaining a synchronised local copy for offline operation and performance.",
      ]},
    ] },
  { file: "Aceli_LAT_Integration_Architecture_Document.docx", title: "Integration Architecture Document", subtitle: "Aceli LAT — Sprint 2 Architecture",
    sections: [
      { h1: "1. Integration Overview", paragraphs: [
        "The Integration Architecture Document describes the architecture for integrating the LAT platform with external systems including Salesforce, OpenAI, Anthropic, and Twilio. The integration architecture follows a loosely-coupled pattern with each external system accessed through a dedicated integration component that abstracts the external API and provides a consistent internal interface.",
      ]},
      { h1: "2. Salesforce Integration", paragraphs: [
        "The Salesforce integration provides bidirectional synchronisation between LAT and Salesforce for the lender and visit objects. The integration uses the Salesforce REST API with OAuth 2.0 authentication, implements rate limit compliance through batched operations and exponential backoff, and maintains a complete audit trail of all synchronisation events. Conflict resolution follows a last-writer-wins policy for non-critical fields and a manual review queue for critical fields.",
      ]},
      { h1: "3. LLM Provider Integration", paragraphs: [
        "The LLM provider integration provides access to OpenAI and Anthropic models for transcription and extraction. The integration uses a provider abstraction layer that allows switching between providers based on availability, cost, and performance. The integration includes usage monitoring, cost tracking, and fallback logic to ensure availability when a primary provider experiences an outage.",
      ]},
    ] },
  { file: "Aceli_LAT_NFR_Specification.docx", title: "Non-Functional Requirements Specification", subtitle: "Aceli LAT — Sprint 2 Architecture",
    sections: [
      { h1: "1. Performance Requirements", paragraphs: [
        "The LAT platform must meet specific performance requirements to ensure usability in field conditions. Page load times must remain under three seconds at the 95th percentile on mid-range Android devices with 3G connectivity. AI transcription must complete within sixty seconds for a typical five-minute voice memo. Salesforce synchronisation must complete within thirty seconds per record under normal network conditions. The dashboard must load within three seconds and refresh data at least every five minutes.",
      ]},
      { h1: "2. Reliability Requirements", paragraphs: [
        "The platform must achieve 99.5% uptime during business hours defined as 7am to 7pm local time in each Wave 1 country. Offline capture must function indefinitely without network connectivity, with synchronisation occurring automatically when connectivity returns. Data must be durable with zero data loss tolerance for captured field data, achieved through local persistence, server-side replication, and automated backup.",
      ]},
      { h1: "3. Security Requirements", paragraphs: [
        "All data must be encrypted at rest using AES-256 and in transit using TLS 1.3. Authentication must use JWT-based sessions with HTTP-only cookies and seven-day expiration. Role-based access control must enforce country-scoped access for Country Directors and Country Managers. The audit trail must capture all data and decision events with seven-year retention to meet donor compliance requirements.",
      ]},
    ] },
  { file: "Aceli_LAT_RBAC_Matrix.docx", title: "RBAC Matrix", subtitle: "Aceli LAT — Sprint 2 Architecture",
    sections: [
      { h1: "1. Role Definitions", paragraphs: [
        "The Role-Based Access Control (RBAC) Matrix defines the roles, permissions, and access scopes for the LAT platform. The roles include Programme Director with global access, Country Director with country-scoped access, Country Manager with country-scoped access, LAT Working Group Member with country and self-scoped access, HQ Analyst with global read access, and System Administrator with global administrative access.",
      ]},
      { h1: "2. Permission Matrix", paragraphs: [
        "The permission matrix maps each role to the operations they can perform on each resource type. The matrix follows a least-privilege principle with each role granted only the permissions required for their function. The matrix is enforced at the API layer through middleware that validates the user's role and scope against the requested operation and resource.",
      ]},
    ] },
  { file: "Aceli_LAT_Data_Flow_Diagrams.docx", title: "Data Flow Diagrams", subtitle: "Aceli LAT — Sprint 2 Architecture",
    sections: [
      { h1: "1. Field Capture Data Flow", paragraphs: [
        "The field capture data flow describes the movement of data from the field capture interface through local persistence, synchronisation, AI extraction, review, and Salesforce write-back. The flow begins with the Working Group Member capturing data on the mobile interface, which is persisted locally in IndexedDB. When connectivity returns, the data is synchronised to the server, queued for AI extraction, processed by the LLM provider, queued for human review, reviewed by the Country Manager, and finally written back to Salesforce with full audit trail capture.",
      ]},
      { h1: "2. Salesforce Sync Data Flow", paragraphs: [
        "The Salesforce sync data flow describes the bidirectional synchronisation between LAT and Salesforce. The flow covers both LAT-to-Salesforce updates triggered by review approvals and Salesforce-to-LAT updates triggered by external Salesforce changes. The flow includes conflict detection, conflict resolution, and audit trail capture at each step.",
      ]},
    ] },
  { file: "Aceli_LAT_Sequence_Diagrams.docx", title: "Sequence Diagrams", subtitle: "Aceli LAT — Sprint 2 Architecture",
    sections: [
      { h1: "1. Visit Capture Sequence", paragraphs: [
        "The visit capture sequence documents the temporal ordering of interactions between the Working Group Member, the LAT mobile client, the LAT server, the LLM provider, and Salesforce during a typical lender visit capture and review cycle. The sequence covers offline capture, synchronisation, AI extraction, human review, and Salesforce write-back, with explicit error handling and recovery paths documented for each step.",
      ]},
      { h1: "2. Salesforce Sync Sequence", paragraphs: [
        "The Salesforce sync sequence documents the temporal ordering of interactions between LAT, Salesforce, and the Country Manager during a bidirectional sync operation. The sequence covers the trigger detection, the conflict detection, the conflict resolution, and the audit trail capture, with explicit handling of rate limits and network failures.",
      ]},
    ] },
  { file: "Aceli_LAT_ADR_Set_v1.docx", title: "Architecture Decision Record Set v1", subtitle: "Aceli LAT — Sprint 2 Architecture",
    sections: [
      { h1: "1. ADR-001: Next.js 16 Selection", paragraphs: [
        "ADR-001 documents the decision to use Next.js 16 as the application framework for the LAT platform. The decision was driven by the need for a unified React-based framework that supports both server-side rendering for performance and client-side interactivity for the field capture interface. Next.js 16 provides the App Router, Server Actions, and built-in API routes that align with the architecture requirements, and has first-class Vercel deployment support that simplifies the deployment pipeline.",
      ]},
      { h1: "2. ADR-002: Neon PostgreSQL Selection", paragraphs: [
        "ADR-002 documents the decision to use Neon PostgreSQL as the primary database for the LAT platform. The decision was driven by the need for a serverless PostgreSQL offering that supports branching for development, automatic scaling for production, and Prisma ORM compatibility. Neon was selected over alternatives including Supabase and PlanetScale based on cost, branching capability, and PostgreSQL feature compatibility.",
      ]},
      { h1: "3. ADR-003: Provider Abstraction for LLMs", paragraphs: [
        "ADR-003 documents the decision to implement a provider abstraction layer for LLM access, allowing the platform to switch between OpenAI and Anthropic based on availability, cost, and performance. The decision was driven by the need to avoid vendor lock-in, to provide resilience against provider outages, and to allow cost optimisation as provider pricing evolves.",
      ]},
    ] },
  { file: "Aceli_LAT_AI_Prompt_Workflow_Spec.docx", title: "AI Prompt Workflow Specification", subtitle: "Aceli LAT — Sprint 2 Architecture",
    sections: [
      { h1: "1. Prompt Architecture", paragraphs: [
        "The AI Prompt Workflow Specification documents the prompt engineering architecture for the LAT platform. The specification covers the prompt templates, the few-shot examples, the system prompts, and the response parsing logic for both transcription and extraction. The prompts are versioned and managed through a dedicated prompt registry that supports A/B testing and gradual rollout of prompt changes.",
      ]},
      { h1: "2. Extraction Prompt Design", paragraphs: [
        "The extraction prompt is designed to produce structured JSON output containing the intelligence fields extracted from the transcribed voice memo or visit note. The prompt includes the schema definition, the field descriptions, the confidence scoring instructions, and the few-shot examples. The prompt is tuned for Swahili-English code-switching and includes explicit handling of ambiguous or missing information.",
      ]},
    ] },
  { file: "Aceli_LAT_Exception_Workflow_Spec.docx", title: "Exception Workflow Specification", subtitle: "Aceli LAT — Sprint 2 Architecture",
    sections: [
      { h1: "1. Exception Categories", paragraphs: [
        "The Exception Workflow Specification defines the categories of exceptions that the LAT platform must handle and the workflow for each category. The categories include network exceptions, AI service exceptions, Salesforce API exceptions, validation exceptions, and conflict exceptions. Each category has defined detection, reporting, recovery, and escalation procedures documented in the specification.",
      ]},
    ] },
  { file: "Aceli_LAT_Salesforce_Mapping_Spec_v1.docx", title: "Salesforce Mapping Specification v1", subtitle: "Aceli LAT — Sprint 2 Architecture",
    sections: [
      { h1: "1. Object Mappings", paragraphs: [
        "The Salesforce Mapping Specification documents the mapping between LAT data objects and Salesforce objects. The specification covers the Account object mapping for lenders, the Visit object mapping (custom object), the Contact object mapping for lender institution staff, and the Task object mapping for follow-up actions. Each mapping documents the field-level correspondence, the data type conversions, and the validation rules applied during synchronisation.",
      ]},
    ] },
  { file: "Aceli_LAT_v0.3.0_Design_Signoff_Release_Notes.docx", title: "v0.3.0 Design Sign-off Release Notes", subtitle: "Aceli LAT — Sprint 2 Architecture",
    sections: [
      { h1: "1. Release Overview", paragraphs: [
        "Version 0.3.0 marks the completion of Sprint 2 Architecture and Design activities and the formal design sign-off that triggers the M3 milestone payment. The release comprises the complete set of architecture and design artefacts that govern the engineering build in Sprints 3 through 7. All deliverables have been reviewed and signed off by the Aceli Programme Director, Country Directors, and the Z.ai Delivery architect lead.",
      ]},
    ] },
];

// Main
(async () => {
  console.log("Generating Sprint 1 docs…");
  for (const d of sprint1Docs) {
    await buildDocFile("sprint1", d.file, d.title, d.subtitle, d.meta, `v1.0  |  ${d.subtitle}`, d.sections);
  }

  console.log("\nGenerating Sprint 2 docs…");
  for (const d of sprint2Docs) {
    await buildSimpleDoc("sprint2", d.file, d.title, d.subtitle, "v1.0", "March 2026", d.sections);
  }
  for (const d of sprint2Extra) {
    await buildSimpleDoc("sprint2", d.file, d.title, d.subtitle, "v1.0", "March 2026", d.sections);
  }

  console.log("\nGenerating Sprint 3-7 docs…");
  for (const sp of compactSprints) {
    for (const [file, title, ...paragraphs] of sp.docs) {
      const sections = [{ h1: "1. Overview", paragraphs: paragraphs }];
      await buildSimpleDoc(sp.folder, file, title, `Aceli LAT — ${sp.sprintName}`, sp.version, sp.date, sections);
    }
  }

  console.log("\n✓ All sprint docs regenerated.");
})();
