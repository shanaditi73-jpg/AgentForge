'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getRun } from '../../api';
import { Run } from '../../types';
import Link from 'next/link';

function AgentOutput({ name, emoji, output }: { name: string; emoji: string; output: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: '#0f1117',
      border: '1px solid #2d3148',
      borderRadius: '10px',
      marginBottom: '12px',
      overflow: 'hidden'
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: '#e2e8f0'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
          <span>{emoji}</span> {name} Agent
        </span>
        <span style={{ color: '#64748b' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{
          padding: '0 16px 16px',
          color: '#94a3b8',
          fontSize: '13px',
          lineHeight: '1.7',
          whiteSpace: 'pre-wrap'
        }}>
          {output || 'No output recorded'}
        </div>
      )}
    </div>
  );
}

export default function RunDetailPage() {
  const params = useParams();
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      getRun(Number(params.id)).then(data => {
        setRun(data);
        setLoading(false);
      });
    }
  }, [params.id]);

  if (loading) return <div style={{ color: '#64748b', padding: '40px' }}>Loading...</div>;
  if (!run) return <div style={{ color: '#ef4444', padding: '40px' }}>Run not found</div>;

  const agentLogs = run.agent_logs || [];
  const getLog = (name: string) => agentLogs.find(l => l.agent_name === name)?.output || '';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/history" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to history
        </Link>
      </div>

      <div style={{
        background: '#1a1d2e',
        border: '1px solid #2d3148',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>
              Run #{run.id}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>{run.task}</p>
          </div>
          <span style={{
            background: run.status === 'completed' ? '#10b98120' : '#ef444420',
            color: run.status === 'completed' ? '#10b981' : '#ef4444',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {run.status}
          </span>
        </div>
        <div style={{ marginTop: '12px', color: '#475569', fontSize: '12px' }}>
          {new Date(run.created_at).toLocaleString()}
        </div>
      </div>

      <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#e2e8f0', marginBottom: '12px' }}>
        Agent Outputs
      </h2>

      <AgentOutput name="Research" emoji="🔍" output={getLog('research')} />
      <AgentOutput name="Coding"   emoji="💻" output={getLog('coding')} />
      <AgentOutput name="Review"   emoji="✅" output={getLog('review')} />
    </div>
  );
}
