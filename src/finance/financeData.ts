// ─── Finance Controller — Synthetic Batch ───────────────────────────────────
// 60 records: 20 BANK statements + 20 LEDGER entries + 20 INVOICE records
// Designed for honest reconciliation: ~77.5% match rate, 9 exceptions
// ────────────────────────────────────────────────────────────────────────────

export type LedgerSource = 'BANK' | 'LEDGER' | 'INVOICE'
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP'
export type EntryType = 'CREDIT' | 'DEBIT'
export type Category =
  | 'Accounts Receivable'
  | 'SaaS Revenue'
  | 'Consulting'
  | 'License Revenue'
  | 'Enterprise Contract'
  | 'Support Fees'
  | 'Project Payment'
  | 'Wire Transfer'
  | 'Vendor Payment'
  | 'Services'

export interface FinanceRecord {
  id: string
  source: LedgerSource
  referenceId: string        // blank = MISSING_REF scenario
  counterparty: string
  amount: number
  currency: Currency
  date: string               // YYYY-MM-DD
  description: string
  type: EntryType
  category: Category
}

// ─── LEDGER ENTRIES — golden source of truth ────────────────────────────────
export const ledgerEntries: FinanceRecord[] = [
  { id: 'LDG-001', source: 'LEDGER', referenceId: 'PAY-2026-0801', counterparty: 'Acme Corp',      amount: 12450.00, currency: 'INR', date: '2026-08-01', description: 'Q3 license payment',          type: 'CREDIT', category: 'Accounts Receivable' },
  { id: 'LDG-002', source: 'LEDGER', referenceId: 'PAY-2026-0802', counterparty: 'TechStart Inc',  amount:  5200.00, currency: 'INR', date: '2026-08-02', description: 'Monthly SaaS subscription',   type: 'CREDIT', category: 'SaaS Revenue'          },
  { id: 'LDG-003', source: 'LEDGER', referenceId: 'PAY-2026-0803', counterparty: 'GlobalTrade Ltd',amount:  8750.00, currency: 'INR', date: '2026-08-03', description: 'Consulting engagement Aug',    type: 'CREDIT', category: 'Consulting'            },
  { id: 'LDG-004', source: 'LEDGER', referenceId: 'PAY-2026-0804', counterparty: 'DataPipe Corp',  amount:  3100.00, currency: 'INR', date: '2026-08-04', description: 'API license renewal',          type: 'CREDIT', category: 'License Revenue'       },
  { id: 'LDG-005', source: 'LEDGER', referenceId: 'PAY-2026-0805', counterparty: 'QuantumLeap',    amount: 22000.00, currency: 'INR', date: '2026-08-05', description: 'Enterprise contract tranche 1',type: 'CREDIT', category: 'Enterprise Contract'   },
  { id: 'LDG-006', source: 'LEDGER', referenceId: 'PAY-2026-0806', counterparty: 'NexGen Systems', amount:  1850.00, currency: 'INR', date: '2026-08-06', description: 'Premium support August',       type: 'CREDIT', category: 'Support Fees'          },
  { id: 'LDG-007', source: 'LEDGER', referenceId: 'PAY-2026-0807', counterparty: 'ClearPath AG',   amount:  4400.00, currency: 'INR', date: '2026-08-07', description: 'Strategy consulting week 32',  type: 'CREDIT', category: 'Consulting'            },
  { id: 'LDG-008', source: 'LEDGER', referenceId: 'PAY-2026-0808', counterparty: 'BlueSky Tech',   amount:  9300.00, currency: 'INR', date: '2026-08-08', description: 'Infrastructure project phase 2', type: 'CREDIT', category: 'Project Payment'    },
  { id: 'LDG-009', source: 'LEDGER', referenceId: 'PAY-2026-0809', counterparty: 'Meridian Corp',  amount:  6600.00, currency: 'INR', date: '2026-08-09', description: 'Outstanding AR settlement',    type: 'CREDIT', category: 'Accounts Receivable' },
  { id: 'LDG-010', source: 'LEDGER', referenceId: 'PAY-2026-0810', counterparty: 'ZenFlow Inc',    amount: 15000.00, currency: 'INR', date: '2026-08-10', description: 'Annual license seat expansion', type: 'CREDIT', category: 'License Revenue'     },
  { id: 'LDG-011', source: 'LEDGER', referenceId: 'PAY-2026-0811', counterparty: 'Vertex Labs',    amount:  2890.00, currency: 'INR', date: '2026-08-11', description: 'Professional services Aug',     type: 'CREDIT', category: 'Services'             },
  { id: 'LDG-012', source: 'LEDGER', referenceId: 'PAY-2026-0812', counterparty: 'SkyBridge Co',   amount:  7200.00, currency: 'INR', date: '2026-08-12', description: 'Consulting retainer Aug',      type: 'CREDIT', category: 'Consulting'            },
  { id: 'LDG-013', source: 'LEDGER', referenceId: 'PAY-2026-0813', counterparty: 'Orbital Ltd',    amount:  3450.00, currency: 'INR', date: '2026-08-13', description: 'SaaS add-on modules',          type: 'CREDIT', category: 'SaaS Revenue'          },
  { id: 'LDG-014', source: 'LEDGER', referenceId: 'PAY-2026-0814', counterparty: 'HorizonNet',     amount: 11000.00, currency: 'INR', date: '2026-08-14', description: 'Enterprise contract tranche 2', type: 'CREDIT', category: 'Enterprise Contract' },
  { id: 'LDG-015', source: 'LEDGER', referenceId: 'PAY-2026-0815', counterparty: 'Nexus Corp',     amount:  4700.00, currency: 'INR', date: '2026-08-15', description: 'Consulting sprint Aug week 2',  type: 'CREDIT', category: 'Consulting'           },
  // LDG-016: bank shows $8,150 (0.91% less — bank processing fee withheld); ledger shows full amount
  { id: 'LDG-016', source: 'LEDGER', referenceId: 'PAY-2026-0816', counterparty: 'ApexData',       amount:  8224.50, currency: 'INR', date: '2026-08-16', description: 'Analytics platform access',    type: 'CREDIT', category: 'Services'             },
  // LDG-017: same amount as bank but booked 2 days later (settlement lag)
  { id: 'LDG-017', source: 'LEDGER', referenceId: 'PAY-2026-0817', counterparty: 'StreamLine',     amount:  2300.00, currency: 'INR', date: '2026-08-19', description: 'Wire transfer — StreamLine',   type: 'CREDIT', category: 'Wire Transfer'        },
  // LDG-018: ledger and invoice agree $19,850; bank paid only $19,500 (short pay — dispute)
  { id: 'LDG-018', source: 'LEDGER', referenceId: 'PAY-2026-0818', counterparty: 'PinnacleSoft',   amount: 19850.00, currency: 'INR', date: '2026-08-18', description: 'Enterprise contract final milestone', type: 'CREDIT', category: 'Enterprise Contract' },
  // LDG-019: matched by invoice only — no bank counterpart (ACH pending)
  { id: 'LDG-019', source: 'LEDGER', referenceId: 'PAY-2026-0820-B', counterparty: 'CloudVertex',  amount:  7800.00, currency: 'INR', date: '2026-08-19', description: 'Cloud infra services Aug',      type: 'CREDIT', category: 'SaaS Revenue'          },
  // LDG-020: orphan — internal FX conversion entry; no bank or invoice counterpart
  { id: 'LDG-020', source: 'LEDGER', referenceId: 'VEND-TXN-0914',   counterparty: 'IronGate GmbH', amount:  4120.00, currency: 'INR', date: '2026-08-20', description: 'EUR→USD vendor conversion',    type: 'DEBIT',  category: 'Vendor Payment'      },
]

// ─── BANK STATEMENT ENTRIES ──────────────────────────────────────────────────
export const bankStatements: FinanceRecord[] = [
  // Pass 1 — Exact matches (15 records)
  { id: 'BNK-001', source: 'BANK', referenceId: 'PAY-2026-0801', counterparty: 'Acme Corp',      amount: 12450.00, currency: 'INR', date: '2026-08-01', description: 'Incoming wire Acme Corp',      type: 'CREDIT', category: 'Accounts Receivable' },
  { id: 'BNK-002', source: 'BANK', referenceId: 'PAY-2026-0802', counterparty: 'TechStart Inc',  amount:  5200.00, currency: 'INR', date: '2026-08-02', description: 'ACH credit TechStart',         type: 'CREDIT', category: 'SaaS Revenue'          },
  { id: 'BNK-003', source: 'BANK', referenceId: 'PAY-2026-0803', counterparty: 'GlobalTrade Ltd',amount:  8750.00, currency: 'INR', date: '2026-08-03', description: 'Wire GlobalTrade consulting',  type: 'CREDIT', category: 'Consulting'            },
  { id: 'BNK-004', source: 'BANK', referenceId: 'PAY-2026-0804', counterparty: 'DataPipe Corp',  amount:  3100.00, currency: 'INR', date: '2026-08-04', description: 'ACH DataPipe license',         type: 'CREDIT', category: 'License Revenue'       },
  { id: 'BNK-005', source: 'BANK', referenceId: 'PAY-2026-0805', counterparty: 'QuantumLeap',    amount: 22000.00, currency: 'INR', date: '2026-08-05', description: 'Wire QuantumLeap contract',    type: 'CREDIT', category: 'Enterprise Contract'   },
  { id: 'BNK-006', source: 'BANK', referenceId: 'PAY-2026-0806', counterparty: 'NexGen Systems', amount:  1850.00, currency: 'INR', date: '2026-08-06', description: 'ACH NexGen support',           type: 'CREDIT', category: 'Support Fees'          },
  { id: 'BNK-007', source: 'BANK', referenceId: 'PAY-2026-0807', counterparty: 'ClearPath AG',   amount:  4400.00, currency: 'INR', date: '2026-08-07', description: 'Wire ClearPath consulting',    type: 'CREDIT', category: 'Consulting'            },
  { id: 'BNK-008', source: 'BANK', referenceId: 'PAY-2026-0808', counterparty: 'BlueSky Tech',   amount:  9300.00, currency: 'INR', date: '2026-08-08', description: 'ACH BlueSky project',          type: 'CREDIT', category: 'Project Payment'       },
  { id: 'BNK-009', source: 'BANK', referenceId: 'PAY-2026-0809', counterparty: 'Meridian Corp',  amount:  6600.00, currency: 'INR', date: '2026-08-09', description: 'Wire Meridian settlement',     type: 'CREDIT', category: 'Accounts Receivable' },
  { id: 'BNK-010', source: 'BANK', referenceId: 'PAY-2026-0810', counterparty: 'ZenFlow Inc',    amount: 15000.00, currency: 'INR', date: '2026-08-10', description: 'ACH ZenFlow license',          type: 'CREDIT', category: 'License Revenue'       },
  { id: 'BNK-011', source: 'BANK', referenceId: 'PAY-2026-0811', counterparty: 'Vertex Labs',    amount:  2890.00, currency: 'INR', date: '2026-08-11', description: 'ACH Vertex services',          type: 'CREDIT', category: 'Services'             },
  { id: 'BNK-012', source: 'BANK', referenceId: 'PAY-2026-0812', counterparty: 'SkyBridge Co',   amount:  7200.00, currency: 'INR', date: '2026-08-12', description: 'Wire SkyBridge consulting',    type: 'CREDIT', category: 'Consulting'            },
  { id: 'BNK-013', source: 'BANK', referenceId: 'PAY-2026-0813', counterparty: 'Orbital Ltd',    amount:  3450.00, currency: 'INR', date: '2026-08-13', description: 'ACH Orbital SaaS',             type: 'CREDIT', category: 'SaaS Revenue'          },
  { id: 'BNK-014', source: 'BANK', referenceId: 'PAY-2026-0814', counterparty: 'HorizonNet',     amount: 11000.00, currency: 'INR', date: '2026-08-14', description: 'Wire HorizonNet contract',     type: 'CREDIT', category: 'Enterprise Contract'   },
  { id: 'BNK-015', source: 'BANK', referenceId: 'PAY-2026-0815', counterparty: 'Nexus Corp',     amount:  4700.00, currency: 'INR', date: '2026-08-15', description: 'ACH Nexus consulting',         type: 'CREDIT', category: 'Consulting'            },
  // Pass 2 — Fuzzy matches (2 records)
  // BNK-016: bank net $8,150 vs ledger $8,224.50 — 0.91% diff (bank deducted processing fee)
  { id: 'BNK-016', source: 'BANK', referenceId: 'PAY-2026-0816', counterparty: 'ApexData',       amount:  8150.00, currency: 'INR', date: '2026-08-16', description: 'Wire ApexData (net of fee)',   type: 'CREDIT', category: 'Services'             },
  // BNK-017: same amount, date 2 days before ledger (bank credited Aug 17; ledger settled Aug 19)
  { id: 'BNK-017', source: 'BANK', referenceId: 'PAY-2026-0817', counterparty: 'StreamLine',     amount:  2300.00, currency: 'INR', date: '2026-08-17', description: 'Wire StreamLine (early credit)', type: 'CREDIT', category: 'Wire Transfer'     },
  // Pass 3 — Partial match (1 record)
  // BNK-018: bank paid $19,500; ledger/invoice show $19,850 — short pay of $350 (dispute)
  { id: 'BNK-018', source: 'BANK', referenceId: 'PAY-2026-0818', counterparty: 'PinnacleSoft',   amount: 19500.00, currency: 'INR', date: '2026-08-18', description: 'Wire PinnacleSoft (short pay)', type: 'CREDIT', category: 'Enterprise Contract' },
  // Exceptions (2 records)
  // BNK-019: no reference ID — unidentified incoming wire
  { id: 'BNK-019', source: 'BANK', referenceId: '',               counterparty: 'Unknown',        amount:  6750.00, currency: 'INR', date: '2026-08-19', description: 'Unidentified incoming wire',   type: 'CREDIT', category: 'Wire Transfer'        },
  // BNK-020: reference not found in any ledger — possible misdirected payment
  { id: 'BNK-020', source: 'BANK', referenceId: 'PAY-2026-0820', counterparty: 'GhostVendor LLC', amount:  5500.00, currency: 'INR', date: '2026-08-20', description: 'Wire — no ledger match found', type: 'CREDIT', category: 'Wire Transfer'       },
]

// ─── INVOICE RECORDS ─────────────────────────────────────────────────────────
export const invoices: FinanceRecord[] = [
  // Pass 1 — Exact matches forming 3-way (bank + ledger + invoice) (10 records)
  { id: 'INV-001', source: 'INVOICE', referenceId: 'PAY-2026-0801', counterparty: 'Acme Corp',      amount: 12450.00, currency: 'INR', date: '2026-07-25', description: 'INV-ACM-2026-001 Q3 license',  type: 'CREDIT', category: 'Accounts Receivable' },
  { id: 'INV-002', source: 'INVOICE', referenceId: 'PAY-2026-0802', counterparty: 'TechStart Inc',  amount:  5200.00, currency: 'INR', date: '2026-07-28', description: 'INV-TEC-2026-002 Aug SaaS',    type: 'CREDIT', category: 'SaaS Revenue'          },
  { id: 'INV-003', source: 'INVOICE', referenceId: 'PAY-2026-0803', counterparty: 'GlobalTrade Ltd',amount:  8750.00, currency: 'INR', date: '2026-07-30', description: 'INV-GLB-2026-003 consulting',  type: 'CREDIT', category: 'Consulting'            },
  { id: 'INV-004', source: 'INVOICE', referenceId: 'PAY-2026-0804', counterparty: 'DataPipe Corp',  amount:  3100.00, currency: 'INR', date: '2026-08-01', description: 'INV-DAT-2026-004 API license', type: 'CREDIT', category: 'License Revenue'       },
  { id: 'INV-005', source: 'INVOICE', referenceId: 'PAY-2026-0805', counterparty: 'QuantumLeap',    amount: 22000.00, currency: 'INR', date: '2026-07-29', description: 'INV-QTM-2026-005 contract T1', type: 'CREDIT', category: 'Enterprise Contract'   },
  { id: 'INV-006', source: 'INVOICE', referenceId: 'PAY-2026-0806', counterparty: 'NexGen Systems', amount:  1850.00, currency: 'INR', date: '2026-08-02', description: 'INV-NXG-2026-006 support Aug', type: 'CREDIT', category: 'Support Fees'          },
  { id: 'INV-007', source: 'INVOICE', referenceId: 'PAY-2026-0807', counterparty: 'ClearPath AG',   amount:  4400.00, currency: 'INR', date: '2026-08-03', description: 'INV-CLR-2026-007 sprint 32',   type: 'CREDIT', category: 'Consulting'            },
  { id: 'INV-008', source: 'INVOICE', referenceId: 'PAY-2026-0808', counterparty: 'BlueSky Tech',   amount:  9300.00, currency: 'INR', date: '2026-08-05', description: 'INV-BLU-2026-008 infra phase2', type: 'CREDIT', category: 'Project Payment'    },
  { id: 'INV-009', source: 'INVOICE', referenceId: 'PAY-2026-0809', counterparty: 'Meridian Corp',  amount:  6600.00, currency: 'INR', date: '2026-08-06', description: 'INV-MER-2026-009 AR settlement', type: 'CREDIT', category: 'Accounts Receivable' },
  { id: 'INV-010', source: 'INVOICE', referenceId: 'PAY-2026-0810', counterparty: 'ZenFlow Inc',    amount: 15000.00, currency: 'INR', date: '2026-08-07', description: 'INV-ZEN-2026-010 seat expansion', type: 'CREDIT', category: 'License Revenue'  },
  // Invoice-only exact match (LDG-019, no bank counterpart)
  { id: 'INV-011', source: 'INVOICE', referenceId: 'PAY-2026-0820-B', counterparty: 'CloudVertex',  amount:  7800.00, currency: 'INR', date: '2026-08-15', description: 'INV-CLV-2026-011 cloud services', type: 'CREDIT', category: 'SaaS Revenue'    },
  // 3-way exact: INV-012 → LDG-018 ($19,850) — invoice matches ledger; bank was short
  { id: 'INV-012', source: 'INVOICE', referenceId: 'PAY-2026-0818', counterparty: 'PinnacleSoft',   amount: 19850.00, currency: 'INR', date: '2026-08-12', description: 'INV-PIN-2026-012 final milestone', type: 'CREDIT', category: 'Enterprise Contract' },
  // Pass 2 — Fuzzy matches (2 records)
  // INV-013 → LDG-016: ref matches; amount = $8,224.50 (ledger) vs bank $8,150; invoice has ledger amount
  { id: 'INV-013', source: 'INVOICE', referenceId: 'PAY-2026-0816', counterparty: 'ApexData',       amount:  8224.50, currency: 'INR', date: '2026-08-10', description: 'INV-APX-2026-013 analytics',    type: 'CREDIT', category: 'Services'             },
  // INV-014 → LDG-017: ref matches, amount exact, date 5 days before ledger (invoice date vs settlement)
  { id: 'INV-014', source: 'INVOICE', referenceId: 'PAY-2026-0817', counterparty: 'StreamLine',     amount:  2300.00, currency: 'INR', date: '2026-08-14', description: 'INV-STR-2026-014 wire payment',  type: 'CREDIT', category: 'Wire Transfer'        },
  // Exceptions (6 records)
  // INV-015: amount mismatch — $5,100 vs closest ledger (LDG-015) $4,700 = 8.5% too large for fuzzy
  { id: 'INV-015', source: 'INVOICE', referenceId: 'VEND-INV-0815A', counterparty: 'Nexus Corp',    amount:  5100.00, currency: 'INR', date: '2026-08-12', description: 'INV-NXC-2026-015 amended rate',   type: 'CREDIT', category: 'Consulting'          },
  // INV-016: amount mismatch — $3,250 vs LDG-011 $2,890 = 12.5% (Vertex Labs added scope)
  { id: 'INV-016', source: 'INVOICE', referenceId: 'PAY-2026-0811', counterparty: 'Vertex Labs',    amount:  3250.00, currency: 'INR', date: '2026-08-10', description: 'INV-VTX-2026-016 scope addition',  type: 'CREDIT', category: 'Services'           },
  // INV-017: EUR invoice — currency mismatch, no USD equivalent found
  { id: 'INV-017', source: 'INVOICE', referenceId: 'VEND-EUR-0019',  counterparty: 'Contoso GmbH',  amount:  5400.00, currency: 'EUR', date: '2026-08-14', description: 'INV-CON-2026-017 EU vendor EUR',  type: 'DEBIT',  category: 'Vendor Payment'      },
  // INV-018: missing reference ID
  { id: 'INV-018', source: 'INVOICE', referenceId: '',               counterparty: 'VendorX Corp',   amount:  2100.00, currency: 'INR', date: '2026-08-16', description: 'INV-VXC-2026-018 no ref supplied', type: 'DEBIT',  category: 'Vendor Payment'    },
  // INV-019: duplicate — same ref + amount as already-matched BNK-013 / LDG-013
  { id: 'INV-019', source: 'INVOICE', referenceId: 'PAY-2026-0813',  counterparty: 'Orbital Ltd',    amount:  3450.00, currency: 'INR', date: '2026-08-13', description: 'INV-ORB-2026-019 duplicate bill',  type: 'CREDIT', category: 'SaaS Revenue'       },
  // INV-020: future-dated invoice — 14 days beyond batch window
  { id: 'INV-020', source: 'INVOICE', referenceId: 'FWD-INV-0901',   counterparty: 'FutureLoad Co',  amount:  8900.00, currency: 'INR', date: '2026-09-05', description: 'INV-FLD-2026-020 future dated',   type: 'DEBIT',  category: 'Vendor Payment'    },
]

// ─── Combined 60-record batch ────────────────────────────────────────────────
export const financeRecords: FinanceRecord[] = [
  ...bankStatements,
  ...ledgerEntries,
  ...invoices,
]

// ─── Ground truth for accuracy measurement ───────────────────────────────────
// Maps each bank/invoice record id → expected ledger match id (null = exception)
export const groundTruth: Record<string, string | null> = {
  // Bank → Ledger
  'BNK-001': 'LDG-001', 'BNK-002': 'LDG-002', 'BNK-003': 'LDG-003',
  'BNK-004': 'LDG-004', 'BNK-005': 'LDG-005', 'BNK-006': 'LDG-006',
  'BNK-007': 'LDG-007', 'BNK-008': 'LDG-008', 'BNK-009': 'LDG-009',
  'BNK-010': 'LDG-010', 'BNK-011': 'LDG-011', 'BNK-012': 'LDG-012',
  'BNK-013': 'LDG-013', 'BNK-014': 'LDG-014', 'BNK-015': 'LDG-015',
  'BNK-016': 'LDG-016', // fuzzy — amount off 0.91%
  'BNK-017': 'LDG-017', // fuzzy — date off 2 days
  'BNK-018': 'LDG-018', // partial — short pay $350
  'BNK-019': null,      // exception MISSING_REF
  'BNK-020': null,      // exception NO_MATCH
  // Invoice → Ledger
  'INV-001': 'LDG-001', 'INV-002': 'LDG-002', 'INV-003': 'LDG-003',
  'INV-004': 'LDG-004', 'INV-005': 'LDG-005', 'INV-006': 'LDG-006',
  'INV-007': 'LDG-007', 'INV-008': 'LDG-008', 'INV-009': 'LDG-009',
  'INV-010': 'LDG-010', 'INV-011': 'LDG-019', 'INV-012': 'LDG-018',
  'INV-013': 'LDG-016', // fuzzy
  'INV-014': 'LDG-017', // fuzzy
  'INV-015': null,      // exception AMOUNT_MISMATCH
  'INV-016': null,      // exception AMOUNT_MISMATCH
  'INV-017': null,      // exception CURRENCY_MISMATCH
  'INV-018': null,      // exception MISSING_REF
  'INV-019': null,      // exception DUPLICATE
  'INV-020': null,      // exception DATE_WINDOW_EXCEEDED
}

// ─── Cash position seed (opening balance Aug 1) ──────────────────────────────
export const openingBalance = 142_350.00

// ─── Batch metadata ──────────────────────────────────────────────────────────
export const batchMeta = {
  batchId: 'RECON-2026-08-22',
  period: 'Aug 1–20, 2026',
  totalRecords: 60,
  sources: 3,
  generatedAt: '2026-08-22T18:00:00Z',
}
