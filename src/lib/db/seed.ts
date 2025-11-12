/**
 * Database Seed Script for ConstructAid Demo
 * Creates realistic bilingual sample data for Y Combinator presentation
 */
import 'dotenv/config';
import { db } from './index';
import {
  users,
  projects,
  dailyReports,
  rfis,
  changeOrders,
  submittals,
  projectTeamMembers,
  tasks,
} from './schema';

// Helper to generate dates
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // ============================================
    // 1. CREATE DEMO USERS
    // ============================================
    console.log('👥 Creating demo users...');

    const demoUsers = await db.insert(users).values([
      {
        email: 'demo.pm@constructaid.com',
        password: 'demo123', // In production, this would be hashed
        firstName: 'Carlos',
        lastName: 'Rodriguez',
        role: 'GC',
        status: 'ACTIVE',
        company: 'Bond Construction',
        phone: '214-555-0101',
        emailVerified: true,
      },
      {
        email: 'demo.super@constructaid.com',
        password: 'demo123',
        firstName: 'Maria',
        lastName: 'Gonzalez',
        role: 'GC',
        status: 'ACTIVE',
        company: 'Bond Construction',
        phone: '214-555-0102',
        emailVerified: true,
      },
      {
        email: 'demo.owner@constructaid.com',
        password: 'demo123',
        firstName: 'John',
        lastName: 'Smith',
        role: 'OWNER',
        status: 'ACTIVE',
        company: 'Dallas ISD',
        phone: '214-555-0103',
        emailVerified: true,
      },
      {
        email: 'demo.architect@constructaid.com',
        password: 'demo123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'ARCHITECT',
        status: 'ACTIVE',
        company: 'Design Partners LLC',
        phone: '214-555-0104',
        emailVerified: true,
      },
      {
        email: 'demo.sub@constructaid.com',
        password: 'demo123',
        firstName: 'José',
        lastName: 'Martinez',
        role: 'SUB',
        status: 'ACTIVE',
        company: 'Martinez Concrete Inc.',
        phone: '214-555-0105',
        emailVerified: true,
      },
    ]).returning();

    console.log(`✅ Created ${demoUsers.length} demo users`);

    // ============================================
    // 2. CREATE SAMPLE PROJECTS
    // ============================================
    console.log('🏗️  Creating sample projects...');

    const sampleProjects = await db.insert(projects).values([
      {
        name: 'Roosevelt High School STEM Building',
        description: 'New 45,000 SF STEM building with state-of-the-art laboratories, makerspaces, and collaborative learning areas.',
        status: 'in_progress',
        projectNumber: 'DISD-2024-001',
        address: '2210 Winsted Drive',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75211',
        totalBudget: 1850000000, // $18.5M in cents
        spentBudget: 925000000, // $9.25M
        allocatedBudget: 1480000000, // $14.8M
        committedBudget: 1295000000, // $12.95M
        remainingBudget: 555000000, // $5.55M
        startDate: daysAgo(180),
        estimatedCompletion: daysFromNow(210),
        ownerId: demoUsers[2].id, // John Smith (DISD)
        generalContractorId: demoUsers[0].id, // Carlos Rodriguez (Bond)
        progressPercentage: 52,
        completedMilestones: 8,
        totalMilestones: 15,
        createdBy: demoUsers[0].id,
      },
      {
        name: 'Lincoln Elementary Renovation',
        description: 'Complete modernization of 65-year-old elementary school including HVAC replacement, accessibility upgrades, and technology infrastructure.',
        status: 'in_progress',
        projectNumber: 'DISD-2024-002',
        address: '2201 Monterrey Street',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75212',
        totalBudget: 875000000, // $8.75M
        spentBudget: 218750000, // $2.19M
        allocatedBudget: 700000000, // $7M
        committedBudget: 525000000, // $5.25M
        remainingBudget: 656250000, // $6.56M
        startDate: daysAgo(90),
        estimatedCompletion: daysFromNow(360),
        ownerId: demoUsers[2].id,
        generalContractorId: demoUsers[0].id,
        progressPercentage: 18,
        completedMilestones: 2,
        totalMilestones: 12,
        createdBy: demoUsers[0].id,
      },
      {
        name: 'Madison Middle School Athletic Complex',
        description: 'New competition-grade athletic complex including track & field facilities, bleachers, press box, and field lighting.',
        status: 'planning',
        projectNumber: 'DISD-2024-003',
        address: '5000 Bryan Street',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75206',
        totalBudget: 425000000, // $4.25M
        spentBudget: 0,
        allocatedBudget: 382500000, // $3.825M
        committedBudget: 0,
        remainingBudget: 425000000,
        startDate: daysFromNow(45),
        estimatedCompletion: daysFromNow(315),
        ownerId: demoUsers[2].id,
        generalContractorId: demoUsers[0].id,
        progressPercentage: 0,
        completedMilestones: 0,
        totalMilestones: 10,
        createdBy: demoUsers[0].id,
      },
    ]).returning();

    console.log(`✅ Created ${sampleProjects.length} sample projects`);

    // ============================================
    // 3. CREATE BILINGUAL DAILY REPORTS
    // ============================================
    console.log('📝 Creating bilingual daily reports...');

    const dailyReportsData = await db.insert(dailyReports).values([
      // English Daily Report - Recent
      {
        projectId: sampleProjects[0].id,
        reportDate: daysAgo(1),
        weatherCondition: 'Partly Cloudy',
        temperature: '78°F',
        workforceCount: JSON.stringify({
          'Concrete': 8,
          'Electrical': 6,
          'HVAC': 4,
          'General Labor': 12,
        }),
        totalWorkers: 30,
        equipmentUsed: JSON.stringify([
          { name: 'Skid Steer Loader', hours: 8, operator: 'Mike Johnson' },
          { name: 'Scissor Lift', hours: 6, operator: 'David Brown' },
          { name: 'Concrete Mixer', hours: 4, operator: 'Tom Wilson' },
        ]),
        workPerformed: 'Continued foundation work on west wing. Poured concrete for footings in grid lines D-F. Installed electrical conduit in completed foundation sections. HVAC rough-in progressing on schedule in east wing.',
        areasWorked: JSON.stringify(['West Wing Foundation', 'East Wing HVAC Rough-in', 'Electrical Ground Floor']),
        issues: 'Minor delay due to concrete delivery arriving 45 minutes late. Adjusted schedule to complete pour before end of shift.',
        safetyNotes: 'Daily toolbox talk conducted at 7:00 AM on fall protection. All workers wearing proper PPE. No safety incidents reported.',
        visitorsOnSite: JSON.stringify([
          { name: 'Dr. Jennifer Martinez', purpose: 'DISD Project Review', timeIn: '10:00 AM', timeOut: '11:30 AM' },
          { name: 'Mike Thompson', purpose: 'Building Inspector - Foundation', timeIn: '2:00 PM', timeOut: '2:45 PM' },
        ]),
        materialsDelivered: JSON.stringify([
          { material: 'Ready-Mix Concrete', quantity: '24 CY', supplier: 'Texas Concrete Co.', time: '8:45 AM', receivedBy: 'Carlos Rodriguez' },
          { material: 'Electrical Conduit (EMT 3/4")', quantity: '500 LF', supplier: 'Graybar Electric', time: '1:15 PM', receivedBy: 'Maria Gonzalez' },
        ]),
        submittedBy: demoUsers[1].id, // Maria Gonzalez
      },
      // Spanish Daily Report - Showcasing bilingual capability
      {
        projectId: sampleProjects[0].id,
        reportDate: daysAgo(2),
        weatherCondition: 'Soleado',
        temperature: '82°F',
        workforceCount: JSON.stringify({
          'Concreto': 10,
          'Plomería': 5,
          'Carpintería': 8,
          'Trabajo General': 14,
        }),
        totalWorkers: 37,
        equipmentUsed: JSON.stringify([
          { name: 'Retroexcavadora', hours: 7, operator: 'José Martinez' },
          { name: 'Grúa Torre', hours: 8, operator: 'Roberto Silva' },
          { name: 'Compactador', hours: 5, operator: 'Miguel Hernandez' },
        ]),
        workPerformed: 'Se completó la excavación para cimientos del ala este. Se instalaron las formas de concreto para zapatas. El equipo de plomería comenzó la instalación de tuberías subterráneas. Carpinteros trabajando en marcos de madera para paredes temporales.',
        areasWorked: JSON.stringify(['Excavación Ala Este', 'Cimientos Zona Sur', 'Plomería Subterránea']),
        issues: 'Encontramos roca inesperada a 6 pies de profundidad en la zona este. Se requiere equipo de excavación adicional. RFI creado para el ingeniero estructural.',
        safetyNotes: 'Reunión de seguridad matutina sobre protección de zanjas y equipos de excavación. Todo el personal usando cascos, chalecos reflectantes y calzado de seguridad. Inspección de excavaciones completada sin incidentes.',
        visitorsOnSite: JSON.stringify([
          { name: 'Ing. Patricia Morales', purpose: 'Inspección Estructural', timeIn: '9:00 AM', timeOut: '10:30 AM' },
        ]),
        materialsDelivered: JSON.stringify([
          { material: 'Tubería PVC 4"', quantity: '200 LF', supplier: 'Ferguson Plumbing', time: '7:30 AM', receivedBy: 'José Martinez' },
          { material: 'Madera 2x4 (12ft)', quantity: '150 piezas', supplier: 'Lowe\'s Pro', time: '11:00 AM', receivedBy: 'Carlos Rodriguez' },
        ]),
        submittedBy: demoUsers[1].id,
      },
      // English Daily Report - Older
      {
        projectId: sampleProjects[0].id,
        reportDate: daysAgo(5),
        weatherCondition: 'Clear',
        temperature: '75°F',
        workforceCount: JSON.stringify({
          'Framing': 12,
          'Masonry': 6,
          'Plumbing': 4,
          'General Labor': 10,
        }),
        totalWorkers: 32,
        equipmentUsed: JSON.stringify([
          { name: 'Forklift', hours: 8, operator: 'James Miller' },
          { name: 'Man Lift', hours: 7, operator: 'Chris Anderson' },
        ]),
        workPerformed: 'Framing crew completed rough framing for classroom wing A. Masonry team started CMU block installation on north exterior wall. Plumbing rough-in 60% complete on first floor.',
        areasWorked: JSON.stringify(['Classroom Wing A', 'North Exterior Wall', 'First Floor Plumbing']),
        issues: 'None reported',
        safetyNotes: 'Weekly ladder inspection completed. Fire extinguisher serviced. All personnel attended weekly safety meeting on electrical hazards.',
        visitorsOnSite: JSON.stringify([]),
        materialsDelivered: JSON.stringify([
          { material: 'CMU Blocks 8x8x16', quantity: '1,200 units', supplier: 'Acme Block & Brick', time: '6:45 AM', receivedBy: 'Maria Gonzalez' },
        ]),
        submittedBy: demoUsers[1].id,
      },
      // Lincoln Elementary - English
      {
        projectId: sampleProjects[1].id,
        reportDate: daysAgo(1),
        weatherCondition: 'Rainy',
        temperature: '68°F',
        workforceCount: JSON.stringify({
          'HVAC': 6,
          'Electrical': 8,
          'Drywall': 4,
          'General Labor': 6,
        }),
        totalWorkers: 24,
        equipmentUsed: JSON.stringify([
          { name: 'Aerial Work Platform', hours: 6, operator: 'Steve Parker' },
        ]),
        workPerformed: 'HVAC duct installation continuing in north wing classrooms. Electrical team running new circuits for updated lighting fixtures. Drywall crew began wall preparation in office area. Interior work only due to rain.',
        areasWorked: JSON.stringify(['North Wing Classrooms', 'Office Area', 'Main Hallway']),
        issues: 'Rain prevented exterior work. Rescheduled window installation to tomorrow.',
        safetyNotes: 'Indoor work only. Extra caution for wet floors at entrances. Slip hazard signs posted. No incidents.',
        visitorsOnSite: JSON.stringify([
          { name: 'Principal Anna Davis', purpose: 'Progress Walkthrough', timeIn: '3:30 PM', timeOut: '4:15 PM' },
        ]),
        materialsDelivered: JSON.stringify([
          { material: 'LED Light Fixtures', quantity: '48 units', supplier: 'Lighting Depot', time: '9:00 AM', receivedBy: 'Carlos Rodriguez' },
        ]),
        submittedBy: demoUsers[0].id,
      },
    ]).returning();

    console.log(`✅ Created ${dailyReportsData.length} bilingual daily reports`);

    // ============================================
    // 4. CREATE SAMPLE RFIs (Bilingual)
    // ============================================
    console.log('❓ Creating sample RFIs...');

    const rfiData = await db.insert(rfis).values([
      {
        projectId: sampleProjects[0].id,
        rfiNumber: 'RFI-001',
        subject: 'Foundation Depth Clarification - Grid Line E',
        description: 'During excavation for footings along grid line E, we encountered rock formation at 5 feet depth. Original plans show footing depth at 6 feet.',
        question: 'Can we adjust footing depth to 5 feet with additional reinforcement, or do we need to excavate through rock to achieve 6-foot depth as shown on structural plans S-3.1?',
        status: 'answered',
        priority: 'high',
        submittedBy: demoUsers[1].id, // Maria Gonzalez
        assignedTo: demoUsers[3].id, // Sarah Johnson (Architect)
        response: 'After consultation with the structural engineer, footings may be placed at 5-foot depth with the addition of (2) #6 rebar continuous at bottom of footing. Update detail per attached sketch SK-001. No additional cost - covered under contingency.',
        respondedBy: demoUsers[3].id,
        respondedAt: daysAgo(3),
        dueDate: daysAgo(5),
        closedAt: daysAgo(3),
      },
      {
        projectId: sampleProjects[0].id,
        rfiNumber: 'RFI-002',
        subject: 'Ubicación de Paneles Eléctricos - Laboratorio de Ciencias',
        description: 'Los planos arquitectónicos muestran el panel eléctrico EP-2 en la pared norte del laboratorio de ciencias, pero los planos eléctricos lo ubican en la pared este. Necesitamos aclaración antes de proceder con la instalación de conductos.',
        question: '¿Cuál es la ubicación correcta para el panel eléctrico EP-2 en el laboratorio de ciencias del segundo piso? ¿Pared norte según plano A-201 o pared este según plano E-301?',
        status: 'open',
        priority: 'urgent',
        submittedBy: demoUsers[4].id, // José Martinez
        assignedTo: demoUsers[3].id, // Sarah Johnson (Architect)
        dueDate: daysFromNow(2),
      },
      {
        projectId: sampleProjects[0].id,
        rfiNumber: 'RFI-003',
        subject: 'HVAC Equipment Access Panel Size',
        description: 'Mechanical plans show 24"x24" access panel for HVAC unit MU-3, but manufacturer requires minimum 30"x30" for maintenance access per equipment submittal.',
        question: 'Can we increase access panel size to 30"x30" to meet manufacturer requirements? This will require minor framing adjustment in ceiling grid.',
        status: 'pending',
        priority: 'medium',
        submittedBy: demoUsers[1].id,
        assignedTo: demoUsers[3].id,
        dueDate: daysFromNow(7),
      },
    ]).returning();

    console.log(`✅ Created ${rfiData.length} sample RFIs (bilingual)`);

    // ============================================
    // 5. CREATE SAMPLE CHANGE ORDERS
    // ============================================
    console.log('📋 Creating sample change orders...');

    const changeOrderData = await db.insert(changeOrders).values([
      {
        projectId: sampleProjects[0].id,
        changeOrderNumber: 'CO-001',
        title: 'Additional Fire Sprinkler Coverage - Makerspace',
        description: 'Fire marshal inspection identified need for additional sprinkler heads in makerspace area due to updated occupancy classification. Requires 8 additional heads and 60 LF of pipe.',
        reason: 'Code compliance - Fire marshal requirement during initial inspection. Makerspace reclassified from educational to light industrial use requiring different sprinkler density.',
        baseContractAmount: 1850000000, // $18.5M
        clientContingency: 92500000, // $925k (5%)
        contingencyRemaining: 92500000,
        proposedAmount: 3850000, // $38,500
        approvedAmount: 3850000,
        costImpact: 3850000,
        scheduleImpactDays: 3,
        status: 'approved',
        initiatedBy: demoUsers[1].id,
        approvedBy: demoUsers[2].id, // Owner approval
        approvedAt: daysAgo(10),
      },
      {
        projectId: sampleProjects[0].id,
        changeOrderNumber: 'CO-002',
        title: 'Upgraded Flooring - Main Lobby',
        description: 'Owner requested upgrade from standard VCT to porcelain tile in main lobby and administrative area (2,400 SF).',
        reason: 'Owner requested upgrade for enhanced durability and aesthetics in high-traffic public areas.',
        baseContractAmount: 1850000000,
        clientContingency: 92500000,
        contingencyRemaining: 88650000, // $886.5k after CO-001
        proposedAmount: 4200000, // $42,000
        approvedAmount: 0,
        costImpact: 4200000,
        scheduleImpactDays: 5,
        status: 'proposed',
        initiatedBy: demoUsers[0].id,
      },
      {
        projectId: sampleProjects[0].id,
        changeOrderNumber: 'CO-003',
        title: 'Conduit Subterráneo Adicional - Sistema de Seguridad',
        description: 'Se requiere conducto eléctrico subterráneo adicional para sistema de cámaras de seguridad actualizado. El sistema original especificaba 12 cámaras, el nuevo diseño requiere 24 cámaras con mayor cobertura.',
        reason: 'Requisito de seguridad de DISD - sistema de vigilancia mejorado para cumplir con nuevos estándares del distrito.',
        baseContractAmount: 1850000000,
        clientContingency: 92500000,
        contingencyRemaining: 88650000,
        proposedAmount: 2780000, // $27,800
        approvedAmount: 2650000, // $26,500 (negotiated)
        costImpact: 2650000,
        scheduleImpactDays: 2,
        status: 'executed',
        initiatedBy: demoUsers[4].id, // José Martinez
        approvedBy: demoUsers[2].id,
        approvedAt: daysAgo(5),
      },
    ]).returning();

    console.log(`✅ Created ${changeOrderData.length} change orders (bilingual)`);

    // ============================================
    // 6. CREATE SAMPLE SUBMITTALS
    // ============================================
    console.log('📄 Creating sample submittals...');

    const submittalData = await db.insert(submittals).values([
      {
        projectId: sampleProjects[0].id,
        submittalNumber: 'S-0301-001',
        csiDivision: '03',
        specSection: '03 30 00',
        title: 'Cast-in-Place Concrete Mix Design',
        description: 'Concrete mix design for structural elements: 4,000 PSI for foundations, 5,000 PSI for elevated slabs',
        status: 'approved',
        submittedBy: demoUsers[4].id, // José Martinez (Concrete sub)
        reviewedByGC: demoUsers[0].id,
        gcReviewDate: daysAgo(20),
        gcComments: 'Mix design reviewed. Meets specifications. Forwarding to architect for approval.',
        reviewedByArchitect: demoUsers[3].id,
        architectReviewDate: daysAgo(18),
        architectComments: 'Approved. Proceed with production.',
        finalStatus: 'Approved',
        approvedBy: demoUsers[3].id,
        approvedAt: daysAgo(18),
        dueDate: daysAgo(25),
        submittedDate: daysAgo(22),
      },
      {
        projectId: sampleProjects[0].id,
        submittalNumber: 'S-0840-001',
        csiDivision: '08',
        specSection: '08 40 00',
        title: 'Aluminum Storefront System - Main Entrance',
        description: 'Shop drawings and product data for aluminum storefront entrance system including doors, frames, and glazing',
        status: 'under_review',
        submittedBy: demoUsers[4].id,
        reviewedByGC: demoUsers[0].id,
        gcReviewDate: daysAgo(3),
        gcComments: 'Reviewed for general compliance. Two minor comments: 1) Verify wind load calculations for Zone D. 2) Provide thermal break detail.',
        dueDate: daysFromNow(5),
        submittedDate: daysAgo(5),
      },
      {
        projectId: sampleProjects[0].id,
        submittalNumber: 'S-2350-001',
        csiDivision: '23',
        specSection: '23 50 00',
        title: 'Sistema HVAC - Unidades Roof Top',
        description: 'Datos del producto y dibujos de taller para unidades HVAC montadas en techo, incluyendo especificaciones de rendimiento, dimensiones y requisitos de instalación',
        status: 'submitted',
        submittedBy: demoUsers[4].id,
        dueDate: daysFromNow(10),
        submittedDate: daysAgo(2),
      },
    ]).returning();

    console.log(`✅ Created ${submittalData.length} submittals (bilingual)`);

    // ============================================
    // 7. CREATE SAMPLE TASKS
    // ============================================
    console.log('✅ Creating sample tasks...');

    const taskData = await db.insert(tasks).values([
      {
        projectId: sampleProjects[0].id,
        title: 'Schedule Pre-Installation Meeting - Storefront System',
        description: 'Coordinate and schedule pre-installation meeting with glazing subcontractor, GC, and architect to review submittal comments and installation sequence.',
        type: 'general',
        status: 'pending',
        priority: 'high',
        assignedTo: JSON.stringify([demoUsers[0].id]),
        assignedBy: demoUsers[1].id,
        dueDate: daysFromNow(7),
        createdBy: demoUsers[1].id,
      },
      {
        projectId: sampleProjects[0].id,
        title: 'Respond to RFI-002 - Electrical Panel Location',
        description: 'Coordinate with electrical engineer and owner to determine correct location for EP-2 panel. Urgent priority.',
        type: 'rfi',
        status: 'in_progress',
        priority: 'urgent',
        assignedTo: JSON.stringify([demoUsers[3].id]),
        assignedBy: demoUsers[0].id,
        dueDate: daysFromNow(2),
        createdBy: demoUsers[0].id,
      },
      {
        projectId: sampleProjects[0].id,
        title: 'Review and Approve CO-002 - Lobby Flooring Upgrade',
        description: 'Review cost proposal for lobby flooring upgrade and coordinate owner approval meeting.',
        type: 'general',
        status: 'pending',
        priority: 'medium',
        assignedTo: JSON.stringify([demoUsers[2].id]), // Owner
        assignedBy: demoUsers[0].id,
        dueDate: daysFromNow(14),
        createdBy: demoUsers[0].id,
      },
      {
        projectId: sampleProjects[1].id,
        title: 'Submit HVAC Equipment Schedules',
        description: 'Prepare and submit equipment schedules for all HVAC replacement units per spec section 23 00 00',
        type: 'submittal',
        status: 'pending',
        priority: 'high',
        assignedTo: JSON.stringify([demoUsers[4].id]),
        assignedBy: demoUsers[0].id,
        dueDate: daysFromNow(10),
        createdBy: demoUsers[0].id,
      },
    ]).returning();

    console.log(`✅ Created ${taskData.length} tasks`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n🎉 Database seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${demoUsers.length}`);
    console.log(`   🏗️  Projects: ${sampleProjects.length}`);
    console.log(`   📝 Daily Reports: ${dailyReportsData.length} (bilingual)`);
    console.log(`   ❓ RFIs: ${rfiData.length} (bilingual)`);
    console.log(`   📋 Change Orders: ${changeOrderData.length} (bilingual)`);
    console.log(`   📄 Submittals: ${submittalData.length} (bilingual)`);
    console.log(`   ✅ Tasks: ${taskData.length}`);
    console.log('\n🔐 Demo Login Credentials:');
    console.log('   Email: demo.pm@constructaid.com');
    console.log('   Password: demo123');
    console.log('\n🌐 Vercel URL: https://construction-pm-clean.vercel.app');
    console.log('\n💡 The demo showcases bilingual content in English and Spanish');
    console.log('   demonstrating ConstructAid\'s competitive advantage for the');
    console.log('   60% Spanish-speaking construction workforce.\n');

    return {
      users: demoUsers,
      projects: sampleProjects,
      dailyReports: dailyReportsData,
      rfis: rfiData,
      changeOrders: changeOrderData,
      submittals: submittalData,
      tasks: taskData,
    };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if called directly (ES module compatible)
seedDatabase()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
