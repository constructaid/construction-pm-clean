/**
 * Demo User Seed Script
 * Creates demo accounts for testing all roles
 *
 * Run with: npx tsx src/lib/db/seeds/demo-users.ts
 */

import 'dotenv/config';
import { db } from '../index';
import { users, projects, projectTeamMembers } from '../schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seedDemoUsers() {
  console.log('🌱 Seeding demo users...\n');

  const password = await bcrypt.hash('password123', 12);

  // Check if demo users already exist
  const existingOwner = await db.select().from(users).where(eq(users.email, 'owner@demo.com')).limit(1);

  if (existingOwner.length > 0) {
    console.log('⚠️  Demo users already exist. Skipping seed.\n');
    console.log('To re-seed, first delete existing demo users from the database.\n');
    return;
  }

  // Create demo users
  console.log('Creating users...');

  const [owner] = await db.insert(users).values({
    email: 'owner@demo.com',
    password,
    firstName: 'John',
    lastName: 'Owner',
    role: 'OWNER',
    status: 'ACTIVE',
    company: 'ABC Development Corp',
    phone: '(214) 555-0101',
    emailVerified: true,
  }).returning();
  console.log(`✅ Created: ${owner.email} (${owner.role})`);

  const [gc] = await db.insert(users).values({
    email: 'gc@demo.com',
    password,
    firstName: 'Sarah',
    lastName: 'Contractor',
    role: 'GC',
    status: 'ACTIVE',
    company: 'BuildRight Construction',
    phone: '(214) 555-0102',
    emailVerified: true,
  }).returning();
  console.log(`✅ Created: ${gc.email} (${gc.role})`);

  const [architect] = await db.insert(users).values({
    email: 'architect@demo.com',
    password,
    firstName: 'Michael',
    lastName: 'Designer',
    role: 'ARCHITECT',
    status: 'ACTIVE',
    company: 'Design Studio LLC',
    phone: '(214) 555-0103',
    emailVerified: true,
  }).returning();
  console.log(`✅ Created: ${architect.email} (${architect.role})`);

  const [sub] = await db.insert(users).values({
    email: 'sub@demo.com',
    password,
    firstName: 'Carlos',
    lastName: 'Electrician',
    role: 'SUB',
    status: 'ACTIVE',
    company: 'Spark Electric Co',
    phone: '(214) 555-0104',
    emailVerified: true,
  }).returning();
  console.log(`✅ Created: ${sub.email} (${sub.role})\n`);

  // Create demo project
  console.log('Creating demo project...');

  const [demoProject] = await db.insert(projects).values({
    name: 'Downtown Office Tower',
    description: 'Class A office building with retail on ground floor. 12 stories, 150,000 SF total.',
    projectNumber: 'PROJ-2025-001',
    status: 'in_progress',
    address: '123 Main Street',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201',
    totalBudget: 1500000000, // $15M in cents (max integer is ~$21M)
    spentBudget: 375000000, // $3.75M spent (25%)
    allocatedBudget: 900000000, // $9M allocated (60%)
    committedBudget: 750000000, // $7.5M committed (50%)
    remainingBudget: 1125000000, // $11.25M remaining (75%)
    startDate: new Date('2024-06-01'),
    estimatedCompletion: new Date('2026-12-31'),
    progressPercentage: 25,
    completedMilestones: 3,
    totalMilestones: 12,
    ownerId: owner.id,
    generalContractorId: gc.id,
    createdBy: owner.id,
  }).returning();
  console.log(`✅ Created project: ${demoProject.name} (${demoProject.projectNumber})\n`);

  // Add team members to project
  console.log('Adding team members to project...');

  await db.insert(projectTeamMembers).values([
    {
      projectId: demoProject.id,
      userId: owner.id,
      teamRole: 'owner',
      companyName: 'ABC Development Corp',
      contactName: 'John Owner',
      contactEmail: 'owner@demo.com',
      contactPhone: '(214) 555-0101',
      accessLevel: 'admin',
      canInviteOthers: true,
      scopeOfWork: 'Project financing and ownership',
    },
    {
      projectId: demoProject.id,
      userId: gc.id,
      teamRole: 'general_contractor',
      companyName: 'BuildRight Construction',
      contactName: 'Sarah Contractor',
      contactEmail: 'gc@demo.com',
      contactPhone: '(214) 555-0102',
      accessLevel: 'admin',
      canInviteOthers: true,
      scopeOfWork: 'Construction management and execution',
    },
    {
      projectId: demoProject.id,
      userId: architect.id,
      teamRole: 'architect',
      companyName: 'Design Studio LLC',
      contactName: 'Michael Designer',
      contactEmail: 'architect@demo.com',
      contactPhone: '(214) 555-0103',
      accessLevel: 'standard',
      canInviteOthers: false,
      scopeOfWork: 'Architectural design and coordination',
    },
    {
      projectId: demoProject.id,
      userId: sub.id,
      teamRole: 'subcontractor',
      csiDivision: '26',
      divisionName: 'Electrical',
      scopeOfWork: 'Complete electrical installation including power distribution, lighting, fire alarm, and low voltage systems',
      companyName: 'Spark Electric Co',
      contactName: 'Carlos Electrician',
      contactEmail: 'sub@demo.com',
      contactPhone: '(214) 555-0104',
      accessLevel: 'standard',
      canInviteOthers: false,
    },
  ]);

  console.log('✅ Added 4 team members\n');

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 DEMO DATA SEEDED SUCCESSFULLY!\n');
  console.log('Demo Credentials:');
  console.log('─────────────────────────────────────────────────────────');
  console.log('Owner:      owner@demo.com      / password123');
  console.log('GC:         gc@demo.com         / password123');
  console.log('Architect:  architect@demo.com  / password123');
  console.log('Sub:        sub@demo.com        / password123');
  console.log('─────────────────────────────────────────────────────────');
  console.log('\nDemo Project:');
  console.log(`  Name:     ${demoProject.name}`);
  console.log(`  Number:   ${demoProject.projectNumber}`);
  console.log(`  ID:       ${demoProject.id}`);
  console.log(`  Budget:   $${(demoProject.totalBudget / 100).toLocaleString()}`);
  console.log(`  Progress: ${demoProject.progressPercentage}%`);
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('You can now login at: http://localhost:4321/login\n');
}

// Run the seed function
seedDemoUsers()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
