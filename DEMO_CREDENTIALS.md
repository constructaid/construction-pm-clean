# ConstructAid Demo Credentials

## 🌐 Live Demo URL
**https://construction-pm-clean.vercel.app**

## 🔐 Demo Login Accounts

### Project Manager (General Contractor)
- **Email:** demo.pm@constructaid.com
- **Password:** demo123
- **Name:** Carlos Rodriguez
- **Company:** Bond Construction
- **Role:** GC - General Contractor

### Field Superintendent
- **Email:** demo.super@constructaid.com
- **Password:** demo123
- **Name:** Maria Gonzalez
- **Company:** Bond Construction
- **Role:** GC - Field Superintendent

### Owner Representative
- **Email:** demo.owner@constructaid.com
- **Password:** demo123
- **Name:** John Smith
- **Company:** Dallas ISD
- **Role:** OWNER - Client Representative

### Architect
- **Email:** demo.architect@constructaid.com
- **Password:** demo123
- **Name:** Sarah Johnson
- **Company:** Design Partners LLC
- **Role:** ARCHITECT

### Subcontractor
- **Email:** demo.sub@constructaid.com
- **Password:** demo123
- **Name:** José Martinez
- **Company:** Martinez Concrete Inc.
- **Role:** SUB - Subcontractor

## 🏗️ Sample Projects

### 1. Roosevelt High School STEM Building
- **Project #:** DISD-2024-001
- **Budget:** $18.5M
- **Status:** In Progress (52% complete)
- **Location:** 2210 Winsted Drive, Dallas, TX 75211
- **Description:** New 45,000 SF STEM building with state-of-the-art laboratories

### 2. Lincoln Elementary Renovation
- **Project #:** DISD-2024-002
- **Budget:** $8.75M
- **Status:** In Progress (18% complete)
- **Location:** 2201 Monterrey Street, Dallas, TX 75212
- **Description:** Complete modernization of 65-year-old elementary school

### 3. Madison Middle School Athletic Complex
- **Project #:** DISD-2024-003
- **Budget:** $4.25M
- **Status:** Planning (0% complete)
- **Location:** 5000 Bryan Street, Dallas, TX 75206
- **Description:** New competition-grade athletic complex with track & field

## 📊 Demo Data Highlights

### Bilingual Daily Reports (4 total)
- **English Reports:** 2 recent field reports from Roosevelt HS project
- **Spanish Reports:** 2 reports showcasing bilingual field worker support
- Demonstrates real-world bilingual workflow for 60% Spanish-speaking workforce

### RFIs - Request for Information (3 total)
- **RFI-001:** Foundation Depth Clarification (ANSWERED)
- **RFI-002:** Ubicación de Paneles Eléctricos - Spanish RFI (OPEN)
- **RFI-003:** HVAC Equipment Access Panel Size (PENDING)

### Change Orders (3 total)
- **CO-001:** Additional Fire Sprinkler Coverage - $38,500 (APPROVED)
- **CO-002:** Upgraded Flooring - Main Lobby - $42,000 (PROPOSED)
- **CO-003:** Conduit Subterráneo Adicional - Spanish CO - $26,500 (EXECUTED)

### Submittals (3 total)
- **S-0301-001:** Cast-in-Place Concrete Mix Design (APPROVED)
- **S-0840-001:** Aluminum Storefront System (UNDER REVIEW)
- **S-2350-001:** Sistema HVAC - Spanish submittal (SUBMITTED)

### Tasks (4 total)
- Pre-installation meeting scheduling
- RFI response coordination
- Change order approval workflow
- HVAC submittal preparation

## 🚀 Quick Start Guide

1. Navigate to https://construction-pm-clean.vercel.app
2. Click "Login" in the top navigation
3. Use demo.pm@constructaid.com / demo123
4. Explore the Roosevelt HS STEM Building project
5. Toggle language between English/Spanish using the flag icon
6. View bilingual daily reports, RFIs, and change orders

## 💡 Key Features to Demonstrate

### Bilingual Competitive Advantage
- Click the language toggle (🇺🇸/🇪🇸) in the top navigation
- Homepage immediately translates to Spanish
- Daily reports show bilingual field workforce coordination
- RFIs and Change Orders demonstrate cross-language collaboration

### Field Worker Workflow
- Navigate to Projects → Roosevelt HS → Field
- View recent daily reports from both English and Spanish-speaking workers
- See material deliveries, workforce counts, and safety notes

### Document Management
- Navigate to Projects → Roosevelt HS → RFIs
- Review bilingual RFI workflow (English PM → Spanish Sub → Architect)
- Check Change Orders with contract tracking and contingency management

### Real-Time Collaboration
- View activity feed showing team coordination
- Check task assignments across different roles
- Review submittal approval workflow

## 🎯 Y Combinator Talking Points

1. **Market Opportunity:** 60% of construction workforce speaks Spanish as primary language
2. **Competitive Moat:** Only bilingual construction PM platform purpose-built for field workers
3. **Traction:** Live pilot with Dallas ISD on $18.5M project
4. **Unit Economics:** SaaS model with $299/mo per project vs. $1,500/mo for Procore
5. **Vision:** Become the operating system for construction in underserved markets

## 📝 Running the Seed Script

To populate your local database with demo data:

```bash
npm run seed
```

This will create:
- 5 demo users with different roles
- 3 sample DISD projects with realistic budgets and progress
- 4 bilingual daily reports (English and Spanish)
- 3 bilingual RFIs demonstrating cross-language coordination
- 3 bilingual change orders with contract tracking
- 3 bilingual submittals across different CSI divisions
- 4 sample tasks for workflow demonstration

## 🔄 Resetting Demo Data

If you need to reset the demo data on Vercel:

1. Log into Vercel dashboard
2. Navigate to Neon database console
3. Run: `DELETE FROM users WHERE email LIKE 'demo.%@constructaid.com'`
4. On your local machine: `npm run seed`
5. Vercel will automatically deploy the changes

## 📞 Support

For questions about the demo or YC application:
- **Founder:** [Your contact info]
- **GitHub:** https://github.com/constructaid/construction-pm-clean
- **Vercel:** https://construction-pm-clean.vercel.app

---

**Last Updated:** 2025-11-11
**Demo Data Version:** 1.0.0
**Created for:** Y Combinator W25 Application
