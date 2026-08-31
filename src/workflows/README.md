# RiskShield — System Architecture & Workflow Diagrams

This directory contains visual workflow architecture diagrams for all 5 core subsystems of RiskShield. These images are saved locally in `src/workflows/` for design reference and documentation purposes (not embedded in the production UI).

---

## 1. 🔄 Multi-Source Autonomous Reconciliation
**File**: `src/workflows/01_reconciliation_workflow.jpg`

```mermaid
flowchart LR
    A1[Bank Statement MT940] --> Engine[3-Pass Match Engine]
    A2[ERP General Ledger] --> Engine
    A3[GST e-Invoice QR] --> Engine

    Engine --> P1[Pass 1: Exact Match<br/>Reference ID + Amount ±₹0.01]
    P1 --> P2[Pass 2: Fuzzy Match<br/>±1% Fee Delta & ±2d Lag]
    P2 --> P3[Pass 3: Partial Match<br/>Short-Pays & Variances]

    P3 --> ML[6-D Vector ML<br/>Isolation Forest Scorer]
    ML --> Cleared[Cleared Matches<br/>98.4% Match Rate]
    ML --> Exceptions[Exceptions Queue<br/>7 GAAP Reason Codes]
```

### Key Technical Details:
- **Pass 1 Exact**: Deterministic hash match on Reference ID, Amount, Currency, and Source ID.
- **Pass 2 Fuzzy**: Allows up to $\pm 1.0\%$ payment gateway / MDR fee deduction and $\pm 2$ calendar days ACH/wire settlement window.
- **Pass 3 Partial**: Matches partial collections with open balance allocation.
- **6-D ML Scorer**: Features evaluated: (1) Delta variance ratio, (2) Settlement window lag, (3) FX volatility, (4) Round amount anomaly, (5) Velocity deviation, (6) Account code entropy.

![Reconciliation Workflow](./01_reconciliation_workflow.jpg)

---

## 2. ⚠️ 1-Click GAAP Exception Settlement Workbench
**File**: `src/workflows/02_exception_resolution_workflow.jpg`

```mermaid
flowchart TD
    Exceptions[7 GAAP Exception Codes]
    Exceptions --> E1[AMOUNT_MISMATCH]
    Exceptions --> E2[MISSING_REF]
    Exceptions --> E3[DUPLICATE]
    Exceptions --> E4[CURRENCY_MISMATCH]
    Exceptions --> E5[DATE_WINDOW_EXCEEDED]
    Exceptions --> E6[NO_MATCH]
    Exceptions --> E7[ORPHAN_LEDGER]

    E1 & E2 & E3 & E4 & E5 & E6 & E7 --> Auto[Autonomous 1-Click Settlement Engine]

    Auto --> R1[Post Debit Memo to Counterparty]
    Auto --> R2[Allocate to Suspense Clearing GL 2190]
    Auto --> R3[Void Duplicate & Re-open Master]
    Auto --> R4[Daily Spot FX Booking Rate]

    R1 & R2 & R3 & R4 --> Out1[100% Reconciled Balance Sheet]
    R1 & R2 & R3 & R4 --> Out2[Certified Dark Navy Excel Schedule .xls]
```

### Key Technical Details:
- **Autonomous Rule Mapping**: Every code has a deterministic accounting resolution adhering to GAAP / IFRS standards.
- **Instant Delta Balancing**: Posts offsetting entries directly to Gateway Fee GL 6140 or Suspense GL 2190.
- **Audit Schedule**: Generates color-coded Excel `.xls` audit logs with resolution notes and controller sign-offs.

![Exception Resolution Workflow](./02_exception_resolution_workflow.jpg)

---

## 3. 📈 Forward Cash Forecaster (T+1 … T+7 … T+30)
**File**: `src/workflows/03_cash_forecast_workflow.jpg`

```mermaid
flowchart LR
    Inputs[Reconciled AR/AP & Invoices] --> Engine[Forward Cash Realization Engine]
    Engine --> Spline[Spline Liquidity Curve<br/>T+1 to T+30 Days]
    Spline --> Bands[95% Epistemic Confidence Bands]
    Spline --> Decomp[Inflow vs Outflow Decomposition]
    
    Slider[Interactive DSO Lag Slider<br/>0.8x … 2.0x Multiplier] --> Engine
    Engine --> Runway[Working Capital Runway Simulation]
```

### Key Technical Details:
- **Settlement Weights**: Realistic front-loaded curves ($40\%$ at T+1, $25\%$ at T+2, $15\%$ at T+3, $10\%$ at T+4, $10\%$ at T+5+).
- **DSO Stress-Testing**: Allows controllers to dynamically test delayed collections from 0.8x to 2.0x lag factors.
- **Confidence Bounds**: Calculates epistemic uncertainty intervals around opening, cleared, and closing liquidity.

![Forward Cash Forecast Workflow](./03_cash_forecast_workflow.jpg)

---

## 4. 📑 Statutory Tax Notice & Scrutiny Defense Terminal
**File**: `src/workflows/04_statutory_tax_defense_workflow.jpg`

```mermaid
flowchart TD
    Notice[Incoming Scrutiny Notice DIN<br/>CBDT Sec 148 / Sec 143/2 / GST DRC-01] --> Terminal[Statutory Defense Terminal]
    
    Terminal --> Map[Section 37/1 Deductions & 115BAA 25.17% Regime Simulation]
    Map --> Form1[Option 1: Section 144B Electronic Written Submission with 3-Way Audit Trail]
    Map --> Form2[Option 2: Form 26A / CA Cert under Sec 201/1 to eliminate 30% Disallowance]
    Map --> Form3[Option 3: Form 15CB & TRC DTAA Treaty Rate Clearance]
    Map --> Form4[Option 4: GST DRC-01 Rule 88C Turnover Reconciliation]
    
    Form1 & Form2 & Form3 & Form4 --> DSC[Digital Signature Certificate DSC Class-3 Signing]
    DSC --> Result[100% Mitigation of Section 270A 200% Misreporting Penalty]
```

### Key Technical Details:
- **Regime Simulator**: Compares corporate tax liabilities under Section 115BAA ($25.17\%$), Old Regime ($34.94\%$), and 115BAB ($17.16\%$).
- **Defense Mechanism**: Pairs each statutory challenge (Scrutiny under Sec 148, TDS disallowance under 40(a)(ia), foreign remittances under Sec 195) with official statutory forms.
- **Audit Verification**: Read-only acknowledgment certificate view with DIN reference and timestamp.

![Statutory Tax Defense Workflow](./04_statutory_tax_defense_workflow.jpg)

---

## 5. 🤖 AI Settlement Q&A Copilot Agent
**File**: `src/workflows/05_ai_copilot_agent_workflow.jpg`

```mermaid
flowchart TD
    User[CFO / Controller Natural Language Query] --> Agent[Settlement Q&A Copilot]
    
    subgraph Reasoning Pipeline
        Agent --> S1[1. Query Intent Parser]
        S1 --> S2[2. 3-Source Batch Record Scanner]
        S2 --> S3[3. Variance Delta & Tolerance Evaluator]
        S3 --> S4[4. Reasoning Chain Synthesis]
    end
    
    S4 --> Stream[Word-by-Word Real-Time Streaming Response]
    Stream --> Audit[GAAP Subledger & Document References]
    Stream --> Actions[Actionable Controller Recommendations]
```

### Key Technical Details:
- **Progressive Thinking**: Displays multi-step reasoning steps before streaming answers.
- **Deep Contextual Awareness**: Ingests active batch stats, match rates, open variances, and tax obligations.
- **Auditable Outputs**: References specific GL codes, voucher references, and statutory clauses.

![AI Settlement Copilot Agent Workflow](./05_ai_copilot_agent_workflow.jpg)

---

## 6. ⚡ Modern Tech Stack & Statutory Tax Compliance Architecture
**File**: `src/workflows/06_tech_stack_and_tax_rules.jpg`

```mermaid
flowchart TD
    subgraph Tech Stack
        R[React 19.1] --- TS[TypeScript 5.8] --- V[Vite 6.4] --- S[Supabase Realtime]
        Eng[3-Pass Match Engine] --- ML[6-D Isolation Forest ML] --- Fore[Liquidity Forecaster]
    end
    
    subgraph Statutory Tax Compliance Pillars
        T1[CBDT Corporate Tax Sec 115BAA @ 25.17%]
        T2[Section 270A 200% Misreporting Defense]
        T3[Section 144B NFAC Faceless E-Filing]
        T4[Form 26A / Sec 201 1 Safe-Harbor]
        T5[Form 15CB TRC DTAA Remittance]
        T6[GST DRC-01 Rule 88C Reconciliation]
    end
    
    Tech Stack === Statutory Tax Compliance Pillars
```

### Key Technical Details:
- **Enterprise Engineering**: React 19 concurrent features, TypeScript strict typing, and Supabase cloud persistence.
- **Statutory Audit Defense**: 6 cyber-legal compliance pillars protecting against Section 270A penalties, Section 40(a)(ia) disallowances, and GST turnover variances.

![RiskShield Tech Stack & Statutory Tax Architecture](./06_tech_stack_and_tax_rules.jpg)

