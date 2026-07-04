'use client';

import { useEffect, useState } from 'react';
import { getRuns } from '../api';
import { Run } from '../types';
import Link from 'next/link';

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      background: '#1a1d2e',
      border: `1px solid ${color}30`,
      borderRadius: '12px',
      padding: '20px',
    }}>
      <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>{label}</div>
      <div style={{ color, fontSize: '28px', fontWeight: '700' }}>{value}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRuns().then(data => {
      setRuns(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: '#64748b', padding: '40px' }}>Loading...</div>;

  const total = runs.length;
  const completed = runs.filter(r => r.status === 'completed').length;
  const failed = runs.filter(r => r.status === 'failed').length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Group runs by date for bar chart
  const byDate: Record<string, number> = {};
  runs.forEach(run => {
    const date = run.created_at.split('T')[0] || run.created_at.split(' ')[0];
    byDate[date] = (byDate[date] || 0) + 1;
  });
  const chartData = Object.entries(byDate).slice(-7); // last 7 days
  const maxCount = Math.max(...chartData.map(([, v]) => v), 1);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#e2e8f0', marginBottom: '4px' }}>
          Analytics
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Platform usage and agent performance</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total runs"    value={total}           color="#6366f1" />
        <StatCard label="Completed"     value={completed}       color="#10b981" />
        <StatCard label="Failed"        value={failed}          color="#ef4444" />
        <StatCard label="Success rate"  value={`${successRate}%`} color="#f59e0b" />
      </div>

      {/* Bar chart */}
      <div style={{
        background: '#1a1d2e',
        border: '1px solid #2d3148',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500', marginBottom: '20px' }}>
          Runs per day (last 7 days)
        </div>
        {chartData.length === 0 ? (
          <div style={{ color: '#2d3148', textAlign: 'center', padding: '40px' }}>No data yet</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px' }}>
            {chartData.map(([date, count]) => (
              <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>{count}</span>
                <div style={{
                  width: '100%',
                  height: `${(count / maxCount) * 120}px`,
                  background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
                  borderRadius: '4px 4px 0 0',
                  minHeight: '4px'
                }} />
                <span style={{ color: '#475569', fontSize: '10px' }}>
                  {date.slice(5)} {/* MM-DD */}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent success breakdown */}
      <div style={{
        background: '#1a1d2e',
        border: '1px solid #2d3148',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>
          Run status breakdown
        </div>
        {[
          { label: 'Completed', count: completed, color: '#10b981' },
          { label: 'Failed',    count: failed,    color: '#ef4444' },
          { label: 'Running',   count: runs.filter(r => r.status === 'running').length, color: '#f59e0b' },
        ].map(item => (
          <div key={item.label} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>{item.label}</span>
              <span style={{ color: item.color, fontSize: '13px', fontWeight: '500' }}>{item.count}</span>
            </div>
            <div style={{ height: '6px', background: '#0f1117', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
                background: item.color,
                borderRadius: '3px',
                transition: 'width 1s ease'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
