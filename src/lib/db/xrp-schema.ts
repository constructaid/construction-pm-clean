/**
 * XRPL Transaction Schema
 * MongoDB schema for mirroring XRP Ledger transactions
 * Enables fast querying without hitting blockchain every time
 */

import { pgTable, serial, text, integer, timestamp, boolean, json } from 'drizzle-orm/pg-core';

// Project XRPL Wallets
export const xrpWallets = pgTable('xrp_wallets', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  // Wallet info
  address: text('address').notNull().unique(),
  publicKey: text('public_key').notNull(),
  // NEVER store unencrypted seeds in production - use secure vault
  encryptedSeed: text('encrypted_seed'), // Encrypted version only

  // Wallet metadata
  purpose: text('purpose'), // e.g., "project-escrow", "milestone-payment", "subcontractor-pool"
  role: text('role'), // e.g., "owner", "gc", "subcontractor"

  // Status
  isActive: boolean('is_active').default(true),
  network: text('network').default('testnet'), // testnet, mainnet

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// XRPL Transactions Mirror
export const xrpTransactions = pgTable('xrp_transactions', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  // XRPL transaction data
  hash: text('hash').notNull().unique(),
  type: text('type').notNull(), // Payment, EscrowCreate, EscrowFinish, etc.

  // Accounts
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address'),

  // Amount
  amount: text('amount'), // In XRP
  amountDrops: text('amount_drops'), // In drops (1 XRP = 1,000,000 drops)
  fee: text('fee'), // In XRP

  // Status
  validated: boolean('validated').default(false),
  result: text('result'), // tesSUCCESS, etc.
  ledgerIndex: integer('ledger_index'),

  // Metadata
  memo: text('memo'),
  memoType: text('memo_type'),
  destinationTag: integer('destination_tag'),

  // Construction-specific
  milestoneId: integer('milestone_id'),
  milestoneName: text('milestone_name'),
  csiDivision: text('csi_division'),

  // Escrow-specific
  escrowSequence: integer('escrow_sequence'),
  finishAfter: timestamp('finish_after'),
  cancelAfter: timestamp('cancel_after'),

  // Timestamps
  transactionDate: timestamp('transaction_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),

  // Raw XRPL data (for debugging)
  rawTransaction: json('raw_transaction'),
});

// Payment Applications (AIA G702/G703) linked to XRPL
export const xrpPaymentApplications = pgTable('xrp_payment_applications', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  // Payment app info
  applicationNumber: text('application_number').notNull(),
  period: text('period'), // e.g., "Month ending 2025-01-31"

  // Amounts
  totalContractAmount: text('total_contract_amount'), // In USD
  workCompletedToDate: text('work_completed_to_date'),
  retainage: text('retainage'),
  amountDue: text('amount_due'),

  // XRPL integration
  xrpWalletId: integer('xrp_wallet_id'),
  xrpTransactionHash: text('xrp_transaction_hash'),
  xrpAmount: text('xrp_amount'),
  xrpExchangeRate: text('xrp_exchange_rate'), // USD/XRP at time of payment

  // Status
  status: text('status').default('draft'), // draft, submitted, approved, paid
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  paidAt: timestamp('paid_at'),

  // CSI Divisions breakdown
  divisionsBreakdown: json('divisions_breakdown'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Milestones with XRPL Escrow
export const xrpMilestones = pgTable('xrp_milestones', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  // Milestone info
  name: text('name').notNull(),
  description: text('description'),
  csiDivision: text('csi_division'),

  // Payment info
  paymentAmount: text('payment_amount'), // In USD
  xrpAmount: text('xrp_amount'),

  // XRPL escrow
  escrowWalletAddress: text('escrow_wallet_address'),
  escrowTransactionHash: text('escrow_transaction_hash'),
  escrowCreatedAt: timestamp('escrow_created_at'),
  escrowFinishAfter: timestamp('escrow_finish_after'),
  escrowCancelAfter: timestamp('escrow_cancel_after'),

  // Release conditions
  releaseConditions: json('release_conditions'),
  releaseTransactionHash: text('release_transaction_hash'),
  releasedAt: timestamp('released_at'),

  // Status
  status: text('status').default('pending'), // pending, escrowed, released, cancelled

  // Verification
  verifiedBy: text('verified_by'),
  verifiedAt: timestamp('verified_at'),
  verificationProof: text('verification_proof'), // e.g., photo hash, BIM coordinate

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Exchange Rate History (for USD/XRP conversions)
export const xrpExchangeRates = pgTable('xrp_exchange_rates', {
  id: serial('id').primaryKey(),

  // Rate info
  usdPerXrp: text('usd_per_xrp').notNull(),
  xrpPerUsd: text('xrp_per_usd').notNull(),

  // Source
  source: text('source').default('coinmarketcap'), // API source

  timestamp: timestamp('timestamp').defaultNow(),
});

export type XRPWallet = typeof xrpWallets.$inferSelect;
export type NewXRPWallet = typeof xrpWallets.$inferInsert;

export type XRPTransaction = typeof xrpTransactions.$inferSelect;
export type NewXRPTransaction = typeof xrpTransactions.$inferInsert;

export type XRPPaymentApplication = typeof xrpPaymentApplications.$inferSelect;
export type NewXRPPaymentApplication = typeof xrpPaymentApplications.$inferInsert;

export type XRPMilestone = typeof xrpMilestones.$inferSelect;
export type NewXRPMilestone = typeof xrpMilestones.$inferInsert;

export type XRPExchangeRate = typeof xrpExchangeRates.$inferSelect;
export type NewXRPExchangeRate = typeof xrpExchangeRates.$inferInsert;
