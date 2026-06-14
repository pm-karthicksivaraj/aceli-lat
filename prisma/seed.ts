import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Clean up in reverse dependency order
  console.log('🧹 Cleaning existing data...')
  await prisma.executiveReviewPack.deleteMany()
  await prisma.month12Review.deleteMany()
  await prisma.continuousImprovementItem.deleteMany()
  await prisma.adoptionMetric.deleteMany()
  await prisma.outcomeKPI.deleteMany()
  await prisma.serviceMaturity.deleteMany()
  await prisma.maintenanceItem.deleteMany()
  await prisma.knownIssue.deleteMany()
  await prisma.dRPlan.deleteMany()
  await prisma.backupRecord.deleteMany()
  await prisma.incidentResponse.deleteMany()
  await prisma.warrantyPeriod.deleteMany()
  await prisma.supportTicket.deleteMany()
  await prisma.monitoringAlert.deleteMany()
  await prisma.adminHandover.deleteMany()
  await prisma.countryReadiness.deleteMany()
  await prisma.userFeedback.deleteMany()
  await prisma.countryConfig.deleteMany()
  await prisma.rolloutWave.deleteMany()
  await prisma.pilotDefect.deleteMany()
  await prisma.kPIMeasurement.deleteMany()
  await prisma.migrationRecord.deleteMany()
  await prisma.benchmarkingFeed.deleteMany()
  await prisma.scorecard.deleteMany()
  await prisma.validationRule.deleteMany()
  await prisma.syncRecord.deleteMany()
  await prisma.exceptionQueue.deleteMany()
  await prisma.reviewDecision.deleteMany()
  await prisma.extractionDraft.deleteMany()
  await prisma.voiceMemo.deleteMany()
  await prisma.narrativeNote.deleteMany()
  await prisma.meeting.deleteMany()
  await prisma.activationArea.deleteMany()
  await prisma.lender.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.user.deleteMany()

  // === Sprint 3: Users & Roles ===
  console.log('👤 Creating users...')
  const admin = await prisma.user.create({ data: { email: 'admin@aceli.org', name: 'Admin User', role: 'admin', country: 'Kenya' } })
  const cd1 = await prisma.user.create({ data: { email: 'grace.m@aceli.org', name: 'Grace Mwangi', role: 'country_director', country: 'Kenya' } })
  const cd2 = await prisma.user.create({ data: { email: 'kofi.a@aceli.org', name: 'Kofi Asante', role: 'country_director', country: 'Ghana' } })
  const cm1 = await prisma.user.create({ data: { email: 'amina.h@aceli.org', name: 'Amina Hassan', role: 'country_manager', country: 'Tanzania' } })
  const hq1 = await prisma.user.create({ data: { email: 'david.k@aceli.org', name: 'David Kimani', role: 'hq_analyst' } })
  const hq2 = await prisma.user.create({ data: { email: 'sarah.o@aceli.org', name: 'Sarah Okafor', role: 'hq_executive' } })

  console.log('🔑 Creating role permissions...')
  await prisma.rolePermission.create({ data: { role: 'admin', permissions: JSON.stringify(['all']) } })
  await prisma.rolePermission.create({ data: { role: 'country_director', permissions: JSON.stringify(['lenders:read', 'lenders:write', 'meetings:read', 'meetings:write', 'reviews:read', 'reviews:write']) } })
  await prisma.rolePermission.create({ data: { role: 'country_manager', permissions: JSON.stringify(['lenders:read', 'meetings:read', 'meetings:write', 'notes:write']) } })
  await prisma.rolePermission.create({ data: { role: 'hq_analyst', permissions: JSON.stringify(['dashboard:read', 'scorecards:read', 'benchmarking:read', 'reports:read']) } })
  await prisma.rolePermission.create({ data: { role: 'hq_executive', permissions: JSON.stringify(['dashboard:read', 'reports:read', 'outcome-kpis:read']) } })

  // === Sprint 4: Lenders, Meetings, Notes, Extractions ===
  console.log('🏦 Creating lenders...')
  const lenders = await Promise.all([
    prisma.lender.create({ data: { name: 'Equity Bank Kenya', institutionType: 'bank', country: 'Kenya', region: 'East Africa', contactPerson: 'James Njoroge', contactEmail: 'j.njoroge@equity.co.ke', portfolioSize: 2500000, activationScore: 82, status: 'active' } }),
    prisma.lender.create({ data: { name: 'KCB Group', institutionType: 'bank', country: 'Kenya', region: 'East Africa', contactPerson: 'Mary Wanjiku', contactEmail: 'm.wanjiku@kcb.co.ke', portfolioSize: 3800000, activationScore: 75, status: 'active' } }),
    prisma.lender.create({ data: { name: 'GCB Bank', institutionType: 'bank', country: 'Ghana', region: 'West Africa', contactPerson: 'Kwame Mensah', contactEmail: 'k.mensah@gcb.com.gh', portfolioSize: 1200000, activationScore: 58, status: 'active' } }),
    prisma.lender.create({ data: { name: 'CRDB Bank', institutionType: 'bank', country: 'Tanzania', region: 'East Africa', contactPerson: 'Fatma Ally', contactEmail: 'f.ally@crdb.co.tz', portfolioSize: 900000, activationScore: 64, status: 'active' } }),
    prisma.lender.create({ data: { name: 'ABSA Uganda', institutionType: 'bank', country: 'Uganda', region: 'East Africa', contactPerson: 'Robert Mukasa', contactEmail: 'r.mukasa@absa.co.ug', portfolioSize: 750000, activationScore: 45, status: 'dormant' } }),
    prisma.lender.create({ data: { name: 'Opportunity International SACCO', institutionType: 'cooperative', country: 'Kenya', region: 'East Africa', contactPerson: 'Penina Wambui', contactEmail: 'p.wambui@opportunity.org', portfolioSize: 180000, activationScore: 90, status: 'active' } }),
    prisma.lender.create({ data: { name: 'Fidelity Bank Ghana', institutionType: 'bank', country: 'Ghana', region: 'West Africa', contactPerson: 'Abena Darkwa', contactEmail: 'a.darkwa@fidelitybank.com.gh', portfolioSize: 650000, activationScore: 71, status: 'active' } }),
    prisma.lender.create({ data: { name: 'NMB Bank Tanzania', institutionType: 'bank', country: 'Tanzania', region: 'East Africa', contactPerson: 'John Lusekelo', contactEmail: 'j.lusekelo@nmb.co.tz', portfolioSize: 550000, activationScore: 52, status: 'dormant' } }),
    prisma.lender.create({ data: { name: 'Stanbic Uganda', institutionType: 'bank', country: 'Uganda', region: 'East Africa', contactPerson: 'Grace Akello', contactEmail: 'g.akello@stanbic.co.ug', portfolioSize: 480000, activationScore: 38, status: 'dormant' } }),
    prisma.lender.create({ data: { name: 'Juhudi Kilimo', institutionType: 'microfinance', country: 'Kenya', region: 'East Africa', contactPerson: 'Zawadi Njeri', contactEmail: 'z.njeri@juhudikilimo.com', portfolioSize: 95000, activationScore: 88, status: 'active' } }),
  ])

  console.log('📋 Creating activation areas...')
  const areas = await Promise.all([
    prisma.activationArea.create({ data: { name: 'Lending Volume', description: 'Assessment of lending portfolio size and growth trajectory for agricultural lending', category: 'lending', weight: 1.2, order: 1 } }),
    prisma.activationArea.create({ data: { name: 'Terms & Pricing', description: 'Evaluation of interest rates, repayment terms, and fee structures relative to market', category: 'terms', weight: 1.1, order: 2 } }),
    prisma.activationArea.create({ data: { name: 'Product Fit', description: 'Alignment of lender product offerings with Aceli target crops and value chains', category: 'products', weight: 1.0, order: 3 } }),
    prisma.activationArea.create({ data: { name: 'Pipeline Strength', description: 'Quality and volume of prospective borrower pipeline for agricultural sector', category: 'pipeline', weight: 1.1, order: 4 } }),
    prisma.activationArea.create({ data: { name: 'Constraint Resolution', description: 'Ability and willingness to address systemic constraints in agricultural lending', category: 'constraints', weight: 1.3, order: 5 } }),
    prisma.activationArea.create({ data: { name: 'Relationship Health', description: 'Overall engagement quality, responsiveness, and strategic alignment with Aceli', category: 'relationship', weight: 1.0, order: 6 } }),
  ])

  console.log('📅 Creating meetings...')
  const meetings = await Promise.all([
    prisma.meeting.create({ data: { lenderId: lenders[0].id, userId: cd1.id, title: 'Q2 Portfolio Review', date: new Date('2026-06-10'), location: 'Nairobi', type: 'field_visit', country: 'Kenya', status: 'completed' } }),
    prisma.meeting.create({ data: { lenderId: lenders[0].id, userId: cd1.id, title: 'Product Alignment Discussion', date: new Date('2026-05-28'), location: 'Nairobi', type: 'call', country: 'Kenya', status: 'completed' } }),
    prisma.meeting.create({ data: { lenderId: lenders[1].id, userId: cd1.id, title: 'KCB Activation Strategy', date: new Date('2026-06-12'), location: 'Nairobi', type: 'hq_meeting', country: 'Kenya', status: 'completed' } }),
    prisma.meeting.create({ data: { lenderId: lenders[2].id, userId: cd2.id, title: 'GCB Onboarding Meeting', date: new Date('2026-06-08'), location: 'Accra', type: 'field_visit', country: 'Ghana', status: 'completed' } }),
    prisma.meeting.create({ data: { lenderId: lenders[3].id, userId: cm1.id, title: 'CRDB Field Assessment', date: new Date('2026-06-14'), location: 'Dar es Salaam', type: 'field_visit', country: 'Tanzania', status: 'in_progress' } }),
    prisma.meeting.create({ data: { lenderId: lenders[4].id, userId: cm1.id, title: 'ABSA Reactivation Call', date: new Date('2026-06-15'), type: 'call', country: 'Uganda', status: 'planned' } }),
    prisma.meeting.create({ data: { lenderId: lenders[5].id, userId: cd1.id, title: 'SACCO Partnership Review', date: new Date('2026-06-11'), location: 'Nakuru', type: 'field_visit', country: 'Kenya', status: 'completed' } }),
  ])

  console.log('📝 Creating narrative notes...')
  await Promise.all([
    prisma.narrativeNote.create({ data: { meetingId: meetings[0].id, content: 'Equity Bank reported strong growth in agricultural lending with a 22% increase in portfolio size. They are interested in expanding into dairy and horticulture value chains.', area: 'lending_volume', source: 'typed' } }),
    prisma.narrativeNote.create({ data: { meetingId: meetings[0].id, content: 'Current interest rates for agricultural loans range from 14-18%. Equity expressed willingness to offer preferential rates of 12% for Aceli-referred borrowers.', area: 'terms', source: 'typed' } }),
    prisma.narrativeNote.create({ data: { meetingId: meetings[1].id, content: 'Product fit discussion revealed strong alignment with maize and dairy value chains. GAP identified in horticulture and pulses products.', area: 'products', source: 'voice_extracted' } }),
    prisma.narrativeNote.create({ data: { meetingId: meetings[2].id, content: 'KCB has an active pipeline of approximately 340 agricultural borrowers. However, approval rates remain low at 35%.', area: 'pipeline', source: 'typed' } }),
    prisma.narrativeNote.create({ data: { meetingId: meetings[3].id, content: 'GCB Bank is new to the Aceli program. Initial onboarding discussion covered platform training, lender profiling, and first quarter targets.', area: 'relationship', source: 'typed' } }),
    prisma.narrativeNote.create({ data: { meetingId: meetings[4].id, content: 'CRDB expressed concerns about collateral requirements for smallholder farmers. Exploring group lending and guarantee mechanisms.', area: 'constraints', source: 'voice_extracted' } }),
  ])

  console.log('🎙️ Creating voice memos...')
  const voiceMemos = await Promise.all([
    prisma.voiceMemo.create({ data: { meetingId: meetings[0].id, duration: 342, language: 'en', transcript: 'Full transcript of Equity Bank Q2 review meeting discussing portfolio growth and product alignment...', status: 'transcribed' } }),
    prisma.voiceMemo.create({ data: { meetingId: meetings[4].id, duration: 480, language: 'en', transcript: 'CRDB field assessment transcript covering collateral discussions and smallholder lending constraints...', status: 'transcribed' } }),
    prisma.voiceMemo.create({ data: { meetingId: meetings[5].id, duration: 180, language: 'en', status: 'transcribing' } }),
  ])

  console.log('🤖 Creating extraction drafts...')
  const extractions = await Promise.all([
    prisma.extractionDraft.create({ data: { meetingId: meetings[0].id, voiceMemoId: voiceMemos[0].id, area: 'lending_volume', extractedText: 'Equity Bank reported 22% growth in agricultural lending portfolio. Total portfolio now stands at KES 2.5B. Target markets include dairy and horticulture.', confidence: 0.92, flags: JSON.stringify(['high_confidence']), status: 'pending_review' } }),
    prisma.extractionDraft.create({ data: { meetingId: meetings[0].id, area: 'terms', extractedText: 'Agricultural loan rates currently 14-18%. Preferential rate of 12% offered for Aceli-referred borrowers. Terms: 12-36 months.', confidence: 0.88, flags: JSON.stringify([]), status: 'approved' } }),
    prisma.extractionDraft.create({ data: { meetingId: meetings[1].id, area: 'products', extractedText: 'Strong product fit for maize and dairy value chains. Gap identified in horticulture and pulses products. No existing seasonal products.', confidence: 0.78, flags: JSON.stringify(['partial_extraction']), status: 'pending_review' } }),
    prisma.extractionDraft.create({ data: { meetingId: meetings[2].id, area: 'pipeline', extractedText: 'Active pipeline of 340 agricultural borrowers. Approval rate at 35%. Key constraint is documentation requirements for smallholder applications.', confidence: 0.85, flags: JSON.stringify([]), status: 'needs_followup' } }),
    prisma.extractionDraft.create({ data: { meetingId: meetings[4].id, voiceMemoId: voiceMemos[1].id, area: 'constraints', extractedText: 'Primary constraint is collateral requirements. Group lending and guarantee mechanisms being explored. Regulatory changes expected Q3.', confidence: 0.71, flags: JSON.stringify(['low_confidence', 'needs_verification']), status: 'pending_review' } }),
  ])

  // === Sprint 5: Reviews, Exceptions, Sync ===
  console.log('✅ Creating review decisions...')
  await Promise.all([
    prisma.reviewDecision.create({ data: { extractionId: extractions[1].id, reviewerId: admin.id, decision: 'approved', rationale: 'Data matches meeting notes. Terms confirmed by lender representative.', reviewedAt: new Date('2026-06-10T14:30:00Z') } }),
  ])

  console.log('⚠️ Creating exceptions...')
  await Promise.all([
    prisma.exceptionQueue.create({ data: { entity: 'extraction', entityId: extractions[4].id, type: 'low_confidence', severity: 'medium', message: 'Extraction confidence below 0.75 threshold for constraints area', status: 'open' } }),
    prisma.exceptionQueue.create({ data: { entity: 'sync', entityId: lenders[4].id, type: 'sync_failed', severity: 'high', message: 'Salesforce sync failed for ABSA Uganda - connection timeout', status: 'open' } }),
    prisma.exceptionQueue.create({ data: { entity: 'extraction', entityId: extractions[2].id, type: 'conflict', severity: 'low', message: 'Product fit extraction partially conflicts with existing lender profile data', status: 'in_progress' } }),
  ])

  console.log('🔄 Creating sync records...')
  await Promise.all([
    prisma.syncRecord.create({ data: { entity: 'lender', entityId: lenders[0].id, direction: 'lat_to_sf', status: 'completed', salesforceId: 'SF-001-KE', payload: JSON.stringify({ activationScore: 82 }), lastAttemptAt: new Date('2026-06-10T15:00:00Z') } }),
    prisma.syncRecord.create({ data: { entity: 'lender', entityId: lenders[1].id, direction: 'lat_to_sf', status: 'completed', salesforceId: 'SF-002-KE', payload: JSON.stringify({ activationScore: 75 }), lastAttemptAt: new Date('2026-06-10T15:01:00Z') } }),
    prisma.syncRecord.create({ data: { entity: 'lender', entityId: lenders[4].id, direction: 'lat_to_sf', status: 'failed', errorMessage: 'Connection timeout after 30s', retryCount: 3, lastAttemptAt: new Date('2026-06-12T10:00:00Z') } }),
    prisma.syncRecord.create({ data: { entity: 'extraction', entityId: extractions[1].id, direction: 'lat_to_sf', status: 'completed', salesforceId: 'SF-EXT-001', payload: JSON.stringify({ decision: 'approved' }), lastAttemptAt: new Date('2026-06-10T16:00:00Z') } }),
    prisma.syncRecord.create({ data: { entity: 'lender', entityId: lenders[2].id, direction: 'sf_to_lat', status: 'pending', lastAttemptAt: new Date('2026-06-14T08:00:00Z') } }),
  ])

  // === Sprint 6: Scorecards, Benchmarking, Migration ===
  console.log('📊 Creating scorecards...')
  await Promise.all([
    prisma.scorecard.create({ data: { lenderId: lenders[0].id, period: '2026-Q2', lendingVolume: 85, termsAlignment: 78, productFit: 72, pipelineStrength: 68, constraintResolution: 60, relationshipHealth: 88, overallScore: 75.2 } }),
    prisma.scorecard.create({ data: { lenderId: lenders[1].id, period: '2026-Q2', lendingVolume: 80, termsAlignment: 70, productFit: 65, pipelineStrength: 72, constraintResolution: 55, relationshipHealth: 82, overallScore: 70.7 } }),
    prisma.scorecard.create({ data: { lenderId: lenders[5].id, period: '2026-Q2', lendingVolume: 72, termsAlignment: 85, productFit: 90, pipelineStrength: 80, constraintResolution: 88, relationshipHealth: 92, overallScore: 84.5 } }),
  ])

  console.log('📈 Creating benchmarking feeds...')
  await Promise.all([
    prisma.benchmarkingFeed.create({ data: { country: 'Kenya', period: '2026-Q2', metric: 'avg_activation_score', value: 78.5, status: 'validated', validatedBy: admin.id, validatedAt: new Date('2026-06-12') } }),
    prisma.benchmarkingFeed.create({ data: { country: 'Ghana', period: '2026-Q2', metric: 'avg_activation_score', value: 64.5, status: 'validated', validatedBy: admin.id, validatedAt: new Date('2026-06-12') } }),
    prisma.benchmarkingFeed.create({ data: { country: 'Tanzania', period: '2026-Q2', metric: 'avg_activation_score', value: 58.0, status: 'pending' } }),
    prisma.benchmarkingFeed.create({ data: { country: 'Uganda', period: '2026-Q2', metric: 'avg_activation_score', value: 41.5, status: 'pending' } }),
  ])

  console.log('📦 Creating migration records...')
  await Promise.all([
    prisma.migrationRecord.create({ data: { sourceType: 'google_sheets', targetType: 'lat', entity: 'lender', status: 'migrated', sourceId: 'GS-L001', targetId: lenders[0].id, sourceData: JSON.stringify({ name: 'Equity Bank Kenya', type: 'bank' }), migratedBy: admin.id, migratedAt: new Date('2026-05-15') } }),
    prisma.migrationRecord.create({ data: { sourceType: 'google_sheets', targetType: 'lat', entity: 'lender', status: 'migrated', sourceId: 'GS-L002', targetId: lenders[1].id, sourceData: JSON.stringify({ name: 'KCB Group', type: 'bank' }), migratedBy: admin.id, migratedAt: new Date('2026-05-15') } }),
    prisma.migrationRecord.create({ data: { sourceType: 'google_sheets', targetType: 'lat', entity: 'lender', status: 'validated', sourceId: 'GS-L003', sourceData: JSON.stringify({ name: 'ABSA Uganda', type: 'bank' }) } }),
  ])

  // === Sprint 7: KPIs, Defects, Rollout ===
  console.log('🎯 Creating KPI measurements...')
  await Promise.all([
    prisma.kPIMeasurement.create({ data: { kpiName: 'reconciliation_time_reduction', lenderId: lenders[0].id, country: 'Kenya', period: '2026-Q2', baseline: 8.5, actual: 3.2, target: 3.0, unit: 'hours', source: 'system' } }),
    prisma.kPIMeasurement.create({ data: { kpiName: 'reconciliation_time_reduction', country: 'Kenya', period: '2026-Q2', baseline: 8.5, actual: 3.8, target: 3.0, unit: 'hours', source: 'aggregated' } }),
    prisma.kPIMeasurement.create({ data: { kpiName: 'activation_gap_visibility', country: 'Kenya', period: '2026-Q2', baseline: 35, actual: 82, target: 90, unit: 'percent', source: 'system' } }),
    prisma.kPIMeasurement.create({ data: { kpiName: 'weekly_active_users', country: 'Kenya', period: '2026-W23', baseline: 0, actual: 12, target: 15, unit: 'count', source: 'system' } }),
    prisma.kPIMeasurement.create({ data: { kpiName: 'extraction_accuracy', country: 'Kenya', period: '2026-Q2', baseline: 0, actual: 87, target: 90, unit: 'percent', source: 'system' } }),
  ])

  console.log('🐛 Creating defects...')
  await Promise.all([
    prisma.pilotDefect.create({ data: { title: 'Slow lender search on mobile', description: 'Lender search takes >5s on low-bandwidth connections in rural areas', severity: 'high', category: 'performance', status: 'in_progress', assignee: 'dev-team', country: 'Kenya' } }),
    prisma.pilotDefect.create({ data: { title: 'Voice memo upload fails intermittently', description: 'Voice memo uploads fail when connection drops during upload', severity: 'medium', category: 'functional', status: 'open', country: 'Tanzania' } }),
    prisma.pilotDefect.create({ data: { title: 'Date picker shows wrong timezone', description: 'Meeting date picker displays UTC instead of local timezone', severity: 'low', category: 'ux', status: 'resolved', country: 'Kenya' } }),
  ])

  console.log('🌍 Creating rollout waves...')
  const wave1 = await prisma.rolloutWave.create({ data: { wave: 1, country: 'Ghana', status: 'completed', startDate: new Date('2026-04-01'), endDate: new Date('2026-04-30'), config: JSON.stringify({ languages: ['en'], regions: ['Greater Accra', 'Ashanti'] }) } })
  const wave1b = await prisma.rolloutWave.create({ data: { wave: 1, country: 'Tanzania', status: 'in_progress', startDate: new Date('2026-05-01'), config: JSON.stringify({ languages: ['en', 'sw'], regions: ['Dar es Salaam', 'Morogoro'] }) } })
  const wave2a = await prisma.rolloutWave.create({ data: { wave: 2, country: 'Uganda', status: 'planned', startDate: new Date('2026-07-01'), config: JSON.stringify({ languages: ['en'], regions: ['Central', 'Eastern'] }) } })
  const wave2b = await prisma.rolloutWave.create({ data: { wave: 2, country: 'Ethiopia', status: 'planned', config: JSON.stringify({ languages: ['en', 'am'], regions: ['Addis Ababa', 'Oromia'] }) } })

  console.log('⚙️ Creating country configs...')
  await Promise.all([
    prisma.countryConfig.create({ data: { country: 'Kenya', config: JSON.stringify({ currency: 'KES', languages: ['en', 'sw'], regions: ['Nairobi', 'Central', 'Rift Valley'], pilotCountry: true }), active: true } }),
    prisma.countryConfig.create({ data: { country: 'Ghana', config: JSON.stringify({ currency: 'GHS', languages: ['en'], regions: ['Greater Accra', 'Ashanti', 'Western'], pilotCountry: false }), active: true } }),
    prisma.countryConfig.create({ data: { country: 'Tanzania', config: JSON.stringify({ currency: 'TZS', languages: ['en', 'sw'], regions: ['Dar es Salaam', 'Morogoro', 'Arusha'], pilotCountry: false }), active: true } }),
  ])

  console.log('💬 Creating user feedback...')
  await Promise.all([
    prisma.userFeedback.create({ data: { userId: cd1.id, category: 'feature', title: 'Offline mode needed for field visits', description: 'Many field visits happen in areas with no connectivity. Need full offline capability for data entry.', priority: 'high', status: 'planned', country: 'Kenya' } }),
    prisma.userFeedback.create({ data: { userId: cm1.id, category: 'ux', title: 'Simplify meeting creation flow', description: 'Too many required fields when creating a meeting in the field. Would prefer quick-create with minimal fields.', priority: 'medium', status: 'reviewed', country: 'Tanzania' } }),
  ])

  // === Sprint 8: Country Readiness, Admin Handover, Monitoring, Support ===
  console.log('🏁 Creating country readiness...')
  await Promise.all([
    prisma.countryReadiness.create({ data: { rolloutWaveId: wave1.id, dataMigrationComplete: true, rolesConfigured: true, usersTrained: true, integrationVerified: true, signOffDate: new Date('2026-04-28'), notes: 'All checks passed. Ready for production.' } }),
    prisma.countryReadiness.create({ data: { rolloutWaveId: wave1b.id, dataMigrationComplete: true, rolesConfigured: true, usersTrained: false, integrationVerified: false, notes: 'Training scheduled for next week.' } }),
    prisma.countryReadiness.create({ data: { rolloutWaveId: wave2a.id, dataMigrationComplete: false, rolesConfigured: false, usersTrained: false, integrationVerified: false } }),
  ])

  console.log('🤝 Creating admin handover items...')
  await Promise.all([
    prisma.adminHandover.create({ data: { section: 'system_access', status: 'completed', assignee: admin.id, completionDate: new Date('2026-06-01'), verificationDate: new Date('2026-06-05'), notes: 'All access credentials documented and verified.' } }),
    prisma.adminHandover.create({ data: { section: 'data_management', status: 'completed', assignee: admin.id, completionDate: new Date('2026-06-02'), verificationDate: new Date('2026-06-05') } }),
    prisma.adminHandover.create({ data: { section: 'integrations', status: 'in_progress', assignee: admin.id, notes: 'Salesforce integration docs pending review.' } }),
    prisma.adminHandover.create({ data: { section: 'monitoring', status: 'pending' } }),
    prisma.adminHandover.create({ data: { section: 'support', status: 'pending' } }),
    prisma.adminHandover.create({ data: { section: 'training', status: 'in_progress', assignee: cd1.id, notes: 'Training materials being finalized.' } }),
  ])

  console.log('🔔 Creating monitoring alerts...')
  await Promise.all([
    prisma.monitoringAlert.create({ data: { type: 'sync_failure', severity: 'critical', message: 'Salesforce sync has failed 3 consecutive times for Uganda lenders', entity: 'lender', entityId: lenders[4].id, country: 'Uganda', status: 'active' } }),
    prisma.monitoringAlert.create({ data: { type: 'performance', severity: 'warning', message: 'Average API response time exceeded 2s threshold (current: 2.3s)', status: 'acknowledged' } }),
    prisma.monitoringAlert.create({ data: { type: 'data_quality', severity: 'info', message: '3 lenders have incomplete contact information', status: 'active' } }),
  ])

  console.log('🎫 Creating support tickets...')
  await Promise.all([
    prisma.supportTicket.create({ data: { title: 'Cannot login on mobile device', description: 'Getting 403 error when trying to login from Samsung Galaxy A12', category: 'access', priority: 'high', status: 'in_progress', reporterId: cm1.id, assigneeId: admin.id, country: 'Tanzania' } }),
    prisma.supportTicket.create({ data: { title: 'Dashboard not loading data', description: 'HQ dashboard shows empty cards after login', category: 'technical', priority: 'medium', status: 'open', reporterId: hq1.id } }),
  ])

  // === Sprint 9: Warranty, Incidents, Backups, DR, Known Issues, Maintenance, Maturity ===
  console.log('🛡️ Creating warranty periods...')
  await Promise.all([
    prisma.warrantyPeriod.create({ data: { country: 'Kenya', startDate: new Date('2026-04-01'), endDate: new Date('2026-09-30'), status: 'active', slaTargetHours: 24, issuesResolved: 8, issuesOpen: 2, satisfactionScore: 4.2 } }),
    prisma.warrantyPeriod.create({ data: { country: 'Ghana', startDate: new Date('2026-05-01'), endDate: new Date('2026-10-31'), status: 'active', slaTargetHours: 24, issuesResolved: 3, issuesOpen: 1, satisfactionScore: 3.8 } }),
  ])

  console.log('🚨 Creating incidents...')
  await Promise.all([
    prisma.incidentResponse.create({ data: { title: 'Database connection pool exhausted', description: 'Application became unresponsive due to connection pool exhaustion during peak hours', severity: 'critical', status: 'resolved', assignee: admin.id, timeline: JSON.stringify([{ time: '2026-06-01T08:00:00Z', action: 'Incident detected', by: 'system' }, { time: '2026-06-01T08:15:00Z', action: 'Root cause identified', by: 'admin' }, { time: '2026-06-01T09:00:00Z', action: 'Pool size increased, service restored', by: 'admin' }]), resolution: 'Increased connection pool size from 10 to 25', rootCause: 'Default pool size insufficient for concurrent users', startedAt: new Date('2026-06-01T08:00:00Z'), resolvedAt: new Date('2026-06-01T09:00:00Z') } }),
    prisma.incidentResponse.create({ data: { title: 'Salesforce sync batch failure', description: 'Nightly Salesforce sync batch failed for all Uganda records', severity: 'high', country: 'Uganda', status: 'mitigated', timeline: JSON.stringify([{ time: '2026-06-10T02:00:00Z', action: 'Batch failure detected', by: 'system' }]), startedAt: new Date('2026-06-10T02:00:00Z') } }),
  ])

  console.log('💾 Creating backup records...')
  await Promise.all([
    prisma.backupRecord.create({ data: { type: 'full', scope: 'database', size: 52428800, storagePath: '/backups/2026-06-14-full.db', status: 'completed', verifiedAt: new Date('2026-06-14T04:00:00Z'), startedAt: new Date('2026-06-14T03:00:00Z'), completedAt: new Date('2026-06-14T03:45:00Z') } }),
    prisma.backupRecord.create({ data: { type: 'incremental', scope: 'database', size: 5242880, storagePath: '/backups/2026-06-13-inc.db', status: 'verified', verifiedAt: new Date('2026-06-13T04:30:00Z'), startedAt: new Date('2026-06-13T03:00:00Z'), completedAt: new Date('2026-06-13T03:15:00Z') } }),
  ])

  console.log('🔮 Creating DR plans...')
  await prisma.dRPlan.create({ data: { name: 'Primary DR Plan', description: 'Disaster recovery plan for the Aceli LAT production environment', rtoMinutes: 60, rpoMinutes: 15, strategy: 'active_passive', status: 'tested', lastTestDate: new Date('2026-05-15'), nextTestDate: new Date('2026-08-15'), responsibleTeam: 'DevOps', steps: JSON.stringify([{ step: 1, action: 'Activate secondary environment' }, { step: 2, action: 'Restore latest backup' }, { step: 3, action: 'Verify data integrity' }, { step: 4, action: 'Switch DNS records' }, { step: 5, action: 'Verify user access' }]) } })

  console.log('📋 Creating known issues...')
  await Promise.all([
    prisma.knownIssue.create({ data: { title: 'Voice memo playback delayed on Safari', description: 'Audio playback has a 2-3 second delay when using Safari browser', severity: 'low', category: 'ux', status: 'workaround_available', workaround: 'Use Chrome or Firefox for voice memo playback', affectedCountries: JSON.stringify(['all']), fixVersion: 'v1.4.1' } }),
    prisma.knownIssue.create({ data: { title: 'Excel export truncates long field names', description: 'Exported Excel files truncate field names longer than 31 characters', severity: 'medium', category: 'functional', status: 'fix_planned', fixVersion: 'v1.4.1' } }),
  ])

  console.log('🔧 Creating maintenance items...')
  await Promise.all([
    prisma.maintenanceItem.create({ data: { title: 'Upgrade Prisma to v8', description: 'Major version upgrade for Prisma ORM including performance improvements', category: 'tech_debt', priority: 'medium', effort: 'medium', status: 'backlog' } }),
    prisma.maintenanceItem.create({ data: { title: 'Implement WebSocket for real-time sync', description: 'Replace polling-based sync with WebSocket for real-time Salesforce updates', category: 'enhancement', priority: 'high', effort: 'large', status: 'planned', targetDate: new Date('2026-08-01') } }),
    prisma.maintenanceItem.create({ data: { title: 'Security patch for auth module', description: 'Apply critical security patch for session management vulnerability', category: 'security', priority: 'critical', effort: 'small', status: 'in_progress' } }),
  ])

  console.log('📊 Creating service maturity...')
  await Promise.all([
    prisma.serviceMaturity.create({ data: { dimension: 'reliability', currentLevel: 3, targetLevel: 4, description: 'System uptime and error rate management', evidence: '99.2% uptime over last 90 days', recommendations: 'Implement circuit breakers and automatic failover' } }),
    prisma.serviceMaturity.create({ data: { dimension: 'performance', currentLevel: 2, targetLevel: 4, description: 'Response time and throughput optimization', evidence: 'P95 latency: 1.8s, needs improvement', recommendations: 'Add caching layer, optimize database queries' } }),
    prisma.serviceMaturity.create({ data: { dimension: 'security', currentLevel: 3, targetLevel: 5, description: 'Security controls, compliance, and audit readiness', evidence: 'Security review completed, 2 findings open', recommendations: 'Complete remaining security findings, implement WAF' } }),
    prisma.serviceMaturity.create({ data: { dimension: 'observability', currentLevel: 2, targetLevel: 4, description: 'Logging, monitoring, and alerting capabilities', evidence: 'Basic logging in place, monitoring gaps identified', recommendations: 'Implement structured logging, add APM, create alert runbooks' } }),
    prisma.serviceMaturity.create({ data: { dimension: 'support', currentLevel: 3, targetLevel: 4, description: 'Support processes, SLA management, and incident response', evidence: 'SLA met for 90% of incidents in warranty period', recommendations: 'Automate incident categorization, improve knowledge base' } }),
    prisma.serviceMaturity.create({ data: { dimension: 'documentation', currentLevel: 3, targetLevel: 4, description: 'Documentation completeness, accuracy, and maintenance', evidence: 'Core documentation complete, some gaps in API docs', recommendations: 'Auto-generate API docs, schedule quarterly doc reviews' } }),
  ])

  // === Sprint 10: Outcome KPIs, Adoption Metrics, Continuous Improvement, Month-12 Review, Executive Review ===
  console.log('🎯 Creating outcome KPIs...')
  await Promise.all([
    prisma.outcomeKPI.create({ data: { name: 'Reconciliation Time Reduction', description: 'Percentage reduction in time spent reconciling lender activation data', category: 'efficiency', measurementUnit: 'percent', baseline: 0, target: 60, actual: 62, period: '2026-Q2', country: 'Kenya', status: 'achieved', evidence: 'Baseline: 8.5h → Current: 3.2h = 62% reduction' } }),
    prisma.outcomeKPI.create({ data: { name: 'Activation Gap Visibility', description: 'Percentage of activation gaps identified and tracked across lender portfolio', category: 'activation', measurementUnit: 'percent', baseline: 35, target: 90, actual: 82, period: '2026-Q2', country: 'Kenya', status: 'tracking' } }),
    prisma.outcomeKPI.create({ data: { name: 'Lender Activation Rate', description: 'Percentage of dormant lenders successfully activated through LAT intervention', category: 'activation', measurementUnit: 'percent', baseline: 15, target: 40, actual: 32, period: '2026-Q2', status: 'tracking' } }),
    prisma.outcomeKPI.create({ data: { name: 'Monthly Active Users', description: 'Number of unique monthly active users across all countries', category: 'adoption', measurementUnit: 'count', baseline: 0, target: 25, actual: 18, period: '2026-06', status: 'tracking' } }),
    prisma.outcomeKPI.create({ data: { name: 'AI Extraction Accuracy', description: 'Accuracy rate of AI-generated extraction drafts after reviewer verification', category: 'quality', measurementUnit: 'percent', baseline: 0, target: 90, actual: 87, period: '2026-Q2', status: 'tracking' } }),
    prisma.outcomeKPI.create({ data: { name: 'Field User Satisfaction', description: 'Average satisfaction score from field user feedback surveys', category: 'impact', measurementUnit: 'score', baseline: 0, target: 4.0, actual: 3.9, period: '2026-Q2', status: 'tracking' } }),
  ])

  console.log('📱 Creating adoption metrics...')
  await Promise.all([
    prisma.adoptionMetric.create({ data: { metric: 'daily_active_users', country: 'Kenya', period: '2026-W23', value: 8, target: 10, previousPeriod: 6, unit: 'count' } }),
    prisma.adoptionMetric.create({ data: { metric: 'weekly_active_users', country: 'Kenya', period: '2026-W23', value: 12, target: 15, previousPeriod: 9, unit: 'count' } }),
    prisma.adoptionMetric.create({ data: { metric: 'meetings_logged', country: 'Kenya', period: '2026-W23', value: 23, target: 20, previousPeriod: 18, unit: 'count' } }),
    prisma.adoptionMetric.create({ data: { metric: 'extractions_reviewed', country: 'Kenya', period: '2026-W23', value: 15, target: 15, previousPeriod: 11, unit: 'count' } }),
    prisma.adoptionMetric.create({ data: { metric: 'sync_success_rate', country: 'Kenya', period: '2026-W23', value: 94.2, target: 95, previousPeriod: 91.5, unit: 'percent' } }),
    prisma.adoptionMetric.create({ data: { metric: 'weekly_active_users', country: 'Ghana', period: '2026-W23', value: 6, target: 10, previousPeriod: 4, unit: 'count' } }),
  ])

  console.log('🔄 Creating continuous improvement items...')
  await Promise.all([
    prisma.continuousImprovementItem.create({ data: { title: 'Implement offline-first architecture', description: 'Enable full offline data capture and sync for field users in low-connectivity areas', category: 'technology', source: 'feedback', priority: 'high', impact: 'high', effort: 'large', status: 'planned', owner: 'dev-team', targetDate: new Date('2026-09-01') } }),
    prisma.continuousImprovementItem.create({ data: { title: 'Multi-language support for voice memos', description: 'Add support for Swahili, Amharic, and Luganda voice memo transcription', category: 'technology', source: 'observation', priority: 'medium', impact: 'medium', effort: 'large', status: 'identified' } }),
    prisma.continuousImprovementItem.create({ data: { title: 'Automated KPI reporting', description: 'Generate weekly/monthly KPI reports automatically and distribute to stakeholders', category: 'process', source: 'review', priority: 'medium', impact: 'medium', effort: 'medium', status: 'analyzed' } }),
    prisma.continuousImprovementItem.create({ data: { title: 'Field user training video series', description: 'Create short training videos for key LAT workflows', category: 'training', source: 'feedback', priority: 'medium', impact: 'high', effort: 'medium', status: 'in_progress', owner: cd1.id } }),
  ])

  console.log('📖 Creating Month-12 review sections...')
  await Promise.all([
    prisma.month12Review.create({ data: { section: 'executive_summary', title: 'Executive Summary', content: 'The Aceli LAT platform has demonstrated significant impact on lender activation outcomes across pilot and rollout countries. Key achievements include a 62% reduction in reconciliation time (exceeding the 60% target), 82% activation gap visibility, and growing adoption across 4 countries. The platform has successfully transitioned from pilot to multi-country operations with positive user feedback.', status: 'draft', author: admin.id } }),
    prisma.month12Review.create({ data: { section: 'kpi_outcomes', title: 'KPI Outcomes', content: 'Reconciliation Time Reduction: 62% achieved vs 60% target. Activation Gap Visibility: 82% vs 90% target. Lender Activation Rate: 32% vs 40% target. AI Extraction Accuracy: 87% vs 90% target. Field User Satisfaction: 3.9/5 vs 4.0 target.', status: 'draft', author: admin.id } }),
    prisma.month12Review.create({ data: { section: 'adoption_analysis', title: 'Adoption Analysis', content: 'Kenya leads adoption with 12 weekly active users, followed by Ghana with 6. Meeting logging rates exceed targets in Kenya (23 vs 20 target). Sync success rates are improving (94.2% in Kenya). Uganda and Ethiopia remain in early rollout phase.', status: 'draft', author: hq1.id } }),
    prisma.month12Review.create({ data: { section: 'impact_stories', title: 'Impact Stories', content: 'Equity Bank Kenya: Activation score improved from 65 to 82 through consistent LAT engagement. Juhudi Kilimo SACCO: Achieved highest activation score (90) through product alignment coaching. CRDB Tanzania: Constraints identification led to group lending pilot.', status: 'draft' } }),
    prisma.month12Review.create({ data: { section: 'lessons_learned', title: 'Lessons Learned', content: '1. Offline capability is critical for field adoption. 2. Voice memo transcription significantly reduces data entry burden. 3. Review workflow must remain lightweight to avoid bottlenecks. 4. Country-specific configuration is essential for adoption. 5. Training investment pays dividends in long-term adoption.', status: 'draft' } }),
    prisma.month12Review.create({ data: { section: 'recommendations', title: 'Recommendations', content: '1. Prioritize offline-first architecture for v2.0. 2. Expand multi-language support. 3. Automate KPI reporting. 4. Increase training investment in new rollout countries. 5. Implement WebSocket for real-time sync.', status: 'draft' } }),
    prisma.month12Review.create({ data: { section: 'next_steps', title: 'Next Steps', content: '1. Complete rollout to Uganda and Ethiopia. 2. Launch v2.0 with offline-first architecture. 3. Implement continuous improvement backlog. 4. Conduct Month-18 outcome review. 5. Expand AI capabilities with additional language models.', status: 'draft' } }),
  ])

  console.log('📊 Creating executive review packs...')
  await Promise.all([
    prisma.executiveReviewPack.create({ data: { title: 'Program Overview', description: 'High-level overview of the Aceli LAT program status and achievements', section: 'overview', audience: 'board', status: 'draft', content: JSON.stringify({ summary: 'LAT program successfully deployed across 4 countries with measurable impact on lender activation.', highlights: ['62% reconciliation time reduction', '82% activation gap visibility', '18 monthly active users'] }), dataSources: JSON.stringify(['/api/outcome-kpis', '/api/adoption-metrics']), author: admin.id } }),
    prisma.executiveReviewPack.create({ data: { title: 'KPI Dashboard', description: 'Comprehensive KPI dashboard with trend analysis and country breakdown', section: 'kpi_dashboard', audience: 'executive', status: 'draft', content: JSON.stringify({ metrics: ['reconciliation_time', 'activation_gap', 'activation_rate', 'adoption', 'accuracy', 'satisfaction'] }), dataSources: JSON.stringify(['/api/outcome-kpis', '/api/kpis']), author: hq2.id } }),
    prisma.executiveReviewPack.create({ data: { title: 'Country Highlights', description: 'Country-by-country achievement highlights and challenges', section: 'country_highlights', audience: 'program_team', status: 'draft', content: JSON.stringify({ countries: ['Kenya', 'Ghana', 'Tanzania', 'Uganda'] }), dataSources: JSON.stringify(['/api/lenders', '/api/adoption-metrics']), author: hq1.id } }),
    prisma.executiveReviewPack.create({ data: { title: 'Strategic Recommendations', description: 'Forward-looking strategic recommendations for program continuation and expansion', section: 'strategic_recommendations', audience: 'board', status: 'draft', content: JSON.stringify({ recommendations: ['Expand to 3 additional countries', 'Invest in offline-first architecture', 'Develop mobile-native application'] }), author: admin.id } }),
  ])

  // === Audit Logs ===
  console.log('📜 Creating audit logs...')
  await Promise.all([
    prisma.auditLog.create({ data: { userId: admin.id, action: 'create', entity: 'lender', entityId: lenders[0].id, details: 'Created lender: Equity Bank Kenya' } }),
    prisma.auditLog.create({ data: { userId: cd1.id, action: 'create', entity: 'meeting', entityId: meetings[0].id, details: 'Created meeting: Q2 Portfolio Review' } }),
    prisma.auditLog.create({ data: { userId: admin.id, action: 'approve', entity: 'extraction', entityId: extractions[1].id, details: 'Approved extraction for terms area' } }),
    prisma.auditLog.create({ data: { userId: admin.id, action: 'sync', entity: 'lender', entityId: lenders[0].id, details: 'Synced to Salesforce: SF-001-KE' } }),
  ])

  console.log('✅ Seed completed successfully!')
  console.log(`  Users: 6 | Lenders: ${lenders.length} | Meetings: ${meetings.length} | Activation Areas: ${areas.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
