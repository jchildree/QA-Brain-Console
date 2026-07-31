import { useEffect, useState } from 'react';
import { useOnboarding, STEP_ORDER } from '../context/OnboardingContext';
import { createRecordApi, type RecordDetail } from '../api/client';

const incidentApi = createRecordApi('incident');

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.5)',
} as const;

const panelStyle = {
  background: 'var(--card)',
  border: '1px solid var(--rule)',
  borderRadius: 14,
  padding: 32,
  maxWidth: 480,
  width: '90%',
  color: 'var(--ink)',
} as const;

const bannerStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 40,
  background: 'var(--navy)',
  color: 'var(--paper)',
  padding: '10px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 13,
} as const;

function StepIndicator({ step }: { step: string }) {
  const idx = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
  return (
    <div className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)', marginBottom: 12 }}>
      Step {idx + 1} of {STEP_ORDER.length}
    </div>
  );
}

export function OnboardingModal() {
  const { state, advance, skip } = useOnboarding();
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [recordMissing, setRecordMissing] = useState(false);

  useEffect(() => {
    if (state.step !== 'review' || !state.recordFilename) return;
    incidentApi
      .get(state.recordFilename)
      .then(setRecord)
      .catch(() => setRecordMissing(true));
  }, [state.step, state.recordFilename]);

  useEffect(() => {
    if (recordMissing) advance();
  }, [recordMissing, advance]);

  if (state.step === 'complete') return null;

  if (state.step === 'intake') {
    return (
      <div style={bannerStyle}>
        <span>Step 3 of {STEP_ORDER.length} &mdash; Fill out and submit this incident report</span>
        <button type="button" onClick={skip} style={{ color: 'var(--paper)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>
          Skip
        </button>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <StepIndicator step={state.step} />

        {state.step === 'orientation-types' && (
          <>
            <h2 className="text-lg font-bold" style={{ marginBottom: 12 }}>Welcome to QA-Brain</h2>
            <p style={{ marginBottom: 8 }}>Records are organized into seven controlled types:</p>
            <ul style={{ marginBottom: 16, paddingLeft: 18, listStyle: 'disc' }}>
              <li><b>SOP</b> &mdash; standard operating procedures</li>
              <li><b>CAP</b> &mdash; corrective/preventive actions</li>
              <li><b>Incident</b> &mdash; nonconformances and events</li>
              <li><b>Change</b> &mdash; controlled change requests</li>
              <li><b>Audit</b> &mdash; internal/external audits</li>
              <li><b>Training</b> &mdash; training records</li>
              <li><b>Meeting Minutes</b> &mdash; meeting notes and transcripts</li>
            </ul>
            <button type="button" className="accession-btn" onClick={advance}>Next</button>
          </>
        )}

        {state.step === 'orientation-nav' && (
          <>
            <h2 className="text-lg font-bold" style={{ marginBottom: 12 }}>Getting around</h2>
            <p style={{ marginBottom: 16 }}>
              Use the tabs at the top to jump between record types, search, the Evidence Library, Trash, and Settings.
              Next, you&apos;ll create a real Incident record to see the flow end to end.
            </p>
            <button type="button" className="accession-btn" onClick={advance}>Next</button>
          </>
        )}

        {state.step === 'review' && (
          <>
            <h2 className="text-lg font-bold" style={{ marginBottom: 12 }}>Nice work</h2>
            {record ? (
              <div style={{ marginBottom: 16, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 13 }}>
                <div>{String(record.frontmatter.id)}</div>
                <div>Status: {String(record.frontmatter.status)}</div>
              </div>
            ) : (
              <p style={{ marginBottom: 16, color: 'var(--ink-dim)' }}>Loading your record&hellip;</p>
            )}
            <button type="button" className="accession-btn" onClick={advance}>Next</button>
          </>
        )}

        {state.step === 'cleanup' && (
          <>
            <h2 className="text-lg font-bold" style={{ marginBottom: 12 }}>Clean up</h2>
            <p style={{ marginBottom: 16 }}>
              That record was just for practice. Clean it up and it&apos;ll move to Trash, where it can still be restored later.
            </p>
            <button
              type="button"
              className="accession-btn"
              onClick={async () => {
                if (state.recordFilename) await incidentApi.remove(state.recordFilename);
                advance();
              }}
            >
              Clean up my test record
            </button>
          </>
        )}

        <div style={{ marginTop: 16 }}>
          <button type="button" onClick={skip} style={{ color: 'var(--ink-dim)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>
            Skip onboarding
          </button>
        </div>
      </div>
    </div>
  );
}
