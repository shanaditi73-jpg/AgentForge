'use client';

import { useEffect, useState } from 'react';
import { getRuns } from '../api';
import { Run } from '../types';
import Link from 'next/link';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: '#10b981',
    running:   '#f59e0b',
    failed:    '#ef4444',
    pending:   '#64748b',
  };
  return (
    <span style={{
      background: (colors[status] || '#64748b') + '20',
      color: colors[status] || '#64748b',
      border: `1px solid ${(colors[status] || '#64748b') + '40'}`,
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500'
    }}>
      {status}
    </span>
  );
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRuns().then(data => {
      setRuns(data);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#e2e8f0', marginBottom: '4px' }}>
            Run History
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>All past agent runs</p>
        </div>
        <Link href="/" style={{
          background: '#6366f1',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '14px'
        }}>
          + New Run
        </Link>
      </div>

      {loading ? (
        <div style={{ color: '#64748b' }}>Loading...</div>
      ) : runs.length === 0 ? (
        <div style={{
          background: '#1a1d2e',
          border: '1px solid #2d3148',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          color: '#64748b'
        }}>
          No runs yet. Go submit a task!
        </div>
      ) : (
        <div style={{
          background: '#1a1d2e',
          border: '1px solid #2d3148',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 120px 180px',
            padding: '12px 20px',
            borderBottom: '1px solid #2d3148',
            color: '#64748b',
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>
            <span>ID</span>
            <span>Task</span>
            <span>Status</span>
            <span>Date</span>
          </div>

          {/* Table rows */}
          {runs.map(run => (
            <Link key={run.id} href={`/runs/${run.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 120px 180px',
                padding: '14px 20px',
                borderBottom: '1px solid #2d3148',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#242740')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ color: '#64748b', fontSize: '14px' }}>#{run.id}</span>
                <span style={{
                  color: '#e2e8f0',
                  fontSize: '14px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  paddingRight: '16px'
                }}>
                  {run.task}
                </span>
                <span><StatusBadge status={run.status} /></span>
                <span style={{ color: '#64748b', fontSize: '13px' }}>
                  {new Date(run.created_at).toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
