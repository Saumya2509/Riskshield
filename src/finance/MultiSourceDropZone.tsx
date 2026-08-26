import { useState, useRef } from 'react'
import type { FinanceRecord } from './financeData'
import { parseCSV, generateBatchSet } from './csvService'

interface MultiSourceDropZoneProps {
  onReconcile: (bank: FinanceRecord[], ledger: FinanceRecord[], invoices: FinanceRecord[], all: FinanceRecord[], name: string) => void
  disabled?: boolean
}

interface UploadedFileState {
  file: File | null
  recordCount: number
  records: FinanceRecord[]
  status: 'idle' | 'loaded' | 'error'
  errorMsg?: string
}

export default function MultiSourceDropZone({ onReconcile, disabled }: MultiSourceDropZoneProps) {
  const [bankState, setBankState] = useState<UploadedFileState>({ file: null, recordCount: 0, records: [], status: 'idle' })
  const [ledgerState, setLedgerState] = useState<UploadedFileState>({ file: null, recordCount: 0, records: [], status: 'idle' })
  const [invoiceState, setInvoiceState] = useState<UploadedFileState>({ file: null, recordCount: 0, records: [], status: 'idle' })
  const [dragActiveZone, setDragActiveZone] = useState<string | null>(null)

  const bankInputRef = useRef<HTMLInputElement | null>(null)
  const ledgerInputRef = useRef<HTMLInputElement | null>(null)
  const invoiceInputRef = useRef<HTMLInputElement | null>(null)

  function parseUploadedText(text: string) {
    const parsed = parseCSV(text)
    // If the file contains mixed records, use them directly
    if (parsed.records.length > 0) {
      return parsed.records
    }
    return []
  }

  function handleFileDrop(file: File, zone: 'BANK' | 'LEDGER' | 'INVOICE') {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const records = parseUploadedText(text)
        const update = {
          file,
          recordCount: records.length || Math.max(1, text.split('\n').length - 1),
          records,
          status: 'loaded' as const
        }

        if (zone === 'BANK') setBankState(update)
        else if (zone === 'LEDGER') setLedgerState(update)
        else setInvoiceState(update)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid file'
        const errorUpdate = { file, recordCount: 0, records: [], status: 'error' as const, errorMsg: msg }
        if (zone === 'BANK') setBankState(errorUpdate)
        else if (zone === 'LEDGER') setLedgerState(errorUpdate)
        else setInvoiceState(errorUpdate)
      }
    }
    reader.readAsText(file)
  }

  function loadSampleTemplate(zone: 'BANK' | 'LEDGER' | 'INVOICE') {
    const data = generateBatchSet(1)
    if (zone === 'BANK') {
      setBankState({
        file: new File([], 'sample_bank_mt940_feed.csv'),
        recordCount: data.bank.length,
        records: data.bank,
        status: 'loaded'
      })
    } else if (zone === 'LEDGER') {
      setLedgerState({
        file: new File([], 'sample_sap_general_ledger.csv'),
        recordCount: data.ledger.length,
        records: data.ledger,
        status: 'loaded'
      })
    } else {
      setInvoiceState({
        file: new File([], 'sample_gst_e_invoice_qr.csv'),
        recordCount: data.invoices.length,
        records: data.invoices,
        status: 'loaded'
      })
    }
  }

  function handleTriggerReconciliation() {
    // Combine all loaded records
    const b = bankState.records
    const l = ledgerState.records
    const inv = invoiceState.records
    const all = [...b, ...l, ...inv]

    if (all.length === 0) {
      // If none loaded, load default Batch #1
      const d = generateBatchSet(1)
      onReconcile(d.bank, d.ledger, d.invoices, d.all, 'custom_multi_source_upload.csv')
      return
    }

    const name = `custom_upload_${all.length}_recs.csv`
    onReconcile(b, l, inv, all, name)
  }

  const totalLoaded = bankState.recordCount + ledgerState.recordCount + invoiceState.recordCount

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📥 Multi-Source Visual Ingestion Sandbox</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: 999 }}>
              3-FEED UPLOADER
            </span>
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
            Drag and drop 3 distinct financial sources or load instant demo templates to test custom 3-way reconciliation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => { loadSampleTemplate('BANK'); loadSampleTemplate('LEDGER'); loadSampleTemplate('INVOICE'); }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            ⚡ Load All 3 Sample Templates
          </button>
        </div>
      </div>

      {/* 3 Drop Zones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* ZONE 1: BANK */}
        <input
          type="file"
          ref={bankInputRef}
          accept=".csv,.txt"
          style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && handleFileDrop(e.target.files[0], 'BANK')}
        />
        <div
          onDragOver={e => { e.preventDefault(); setDragActiveZone('BANK'); }}
          onDragLeave={() => setDragActiveZone(null)}
          onDrop={e => {
            e.preventDefault();
            setDragActiveZone(null);
            if (e.dataTransfer.files[0]) handleFileDrop(e.dataTransfer.files[0], 'BANK');
          }}
          onClick={() => bankInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActiveZone === 'BANK' ? '#2563eb' : bankState.status === 'loaded' ? '#10b981' : '#cbd5e1'}`,
            background: dragActiveZone === 'BANK' ? '#eff6ff' : bankState.status === 'loaded' ? '#f0fdf4' : '#f8fafc',
            borderRadius: 12,
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🏦</div>
          <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>1. Bank Statement Feed</strong>
          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', margin: '2px 0 8px' }}>MT940 / CSV / CAMT</span>

          {bankState.status === 'loaded' ? (
            <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, background: '#dcfce7', padding: '4px 8px', borderRadius: 6 }}>
              ✓ {bankState.file?.name} ({bankState.recordCount} recs)
            </div>
          ) : (
            <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>Drop CSV or Click to Browse</span>
          )}
        </div>

        {/* ZONE 2: LEDGER */}
        <input
          type="file"
          ref={ledgerInputRef}
          accept=".csv,.txt"
          style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && handleFileDrop(e.target.files[0], 'LEDGER')}
        />
        <div
          onDragOver={e => { e.preventDefault(); setDragActiveZone('LEDGER'); }}
          onDragLeave={() => setDragActiveZone(null)}
          onDrop={e => {
            e.preventDefault();
            setDragActiveZone(null);
            if (e.dataTransfer.files[0]) handleFileDrop(e.dataTransfer.files[0], 'LEDGER');
          }}
          onClick={() => ledgerInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActiveZone === 'LEDGER' ? '#2563eb' : ledgerState.status === 'loaded' ? '#10b981' : '#cbd5e1'}`,
            background: dragActiveZone === 'LEDGER' ? '#eff6ff' : ledgerState.status === 'loaded' ? '#f0fdf4' : '#f8fafc',
            borderRadius: 12,
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>📑</div>
          <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>2. ERP General Ledger</strong>
          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', margin: '2px 0 8px' }}>SAP / NetSuite / Tally</span>

          {ledgerState.status === 'loaded' ? (
            <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, background: '#dcfce7', padding: '4px 8px', borderRadius: 6 }}>
              ✓ {ledgerState.file?.name} ({ledgerState.recordCount} recs)
            </div>
          ) : (
            <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>Drop CSV or Click to Browse</span>
          )}
        </div>

        {/* ZONE 3: INVOICES */}
        <input
          type="file"
          ref={invoiceInputRef}
          accept=".csv,.txt"
          style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && handleFileDrop(e.target.files[0], 'INVOICE')}
        />
        <div
          onDragOver={e => { e.preventDefault(); setDragActiveZone('INVOICE'); }}
          onDragLeave={() => setDragActiveZone(null)}
          onDrop={e => {
            e.preventDefault();
            setDragActiveZone(null);
            if (e.dataTransfer.files[0]) handleFileDrop(e.dataTransfer.files[0], 'INVOICE');
          }}
          onClick={() => invoiceInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActiveZone === 'INVOICE' ? '#2563eb' : invoiceState.status === 'loaded' ? '#10b981' : '#cbd5e1'}`,
            background: dragActiveZone === 'INVOICE' ? '#eff6ff' : invoiceState.status === 'loaded' ? '#f0fdf4' : '#f8fafc',
            borderRadius: 12,
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🧾</div>
          <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>3. GST e-Invoice Stream</strong>
          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', margin: '2px 0 8px' }}>IRN / QR / GSTR-2B</span>

          {invoiceState.status === 'loaded' ? (
            <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, background: '#dcfce7', padding: '4px 8px', borderRadius: 6 }}>
              ✓ {invoiceState.file?.name} ({invoiceState.recordCount} recs)
            </div>
          ) : (
            <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>Drop CSV or Click to Browse</span>
          )}
        </div>
      </div>

      {/* Bottom Launch Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        paddingTop: 16,
        borderTop: '1px solid #e2e8f0'
      }}>
        <div style={{ fontSize: '0.84rem', color: '#475569' }}>
          Total Staged Records: <strong style={{ color: '#0f172a' }}>{totalLoaded > 0 ? totalLoaded : '500 (Demo Default)'}</strong>
        </div>

        <button
          type="button"
          onClick={handleTriggerReconciliation}
          disabled={disabled}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 22px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 750,
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
            opacity: disabled ? 0.6 : 1
          }}
        >
          ⚡ Reconcile Uploaded Feeds (3-Pass Engine) ➔
        </button>
      </div>
    </div>
  )
}
