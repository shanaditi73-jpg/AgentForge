'use client';

import { useState, useRef, useEffect } from 'react';
import { getWebSocketUrl, getRuns } from './api';
import { AgentUpdate, Run } from './types';
import Link from 'next/link';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: '#10b981',
    running:   '#f59e0b',
    failed:    '#ef4444',
    pending:   '#64748b',
    started:   '#6366f1',
  };
  return (
    <span style={{
      background: (colors[status] || '#64748b') + '20',
      color: colors[status] || '#64748b',
      border: `1px solid ${(colors[status] || '#64748b') + '40'}`,
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'capitalize'
    }}>
      {status}
    </span>
  );
}

function AgentCard({ name, emoji, status, output }: {
  name: string; emoji: string; status: string; output: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: '#1a1d2e',
      border: `1px solid ${status === 'completed' ? '#6366f140' : '#2d3148'}`,
      borderRadius: '12px',
      padding: '16px',
      transition: 'all 0.3s'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: output ? '12px' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{emoji}</span>
          <span style={{ fontWeight: '500', color: '#e2e8f0' }}>{name} Agent</span>
        </div>
        <StatusBadge status={status || 'waiting'} />
      </div>
      {output && (
        <>
          <div style={{
            background: '#0f1117', borderRadius: '8px', padding: '12px',
            fontSize: '13px', color: '#94a3b8', lineHeight: '1.6',
            maxHeight: expanded ? 'none' : '80px',
            overflow: 'hidden', whiteSpace: 'pre-wrap'
          }}>
            {output}
          </div>
          <button onClick={() => setExpanded(!expanded)} style={{
            marginTop: '8px', background: 'none', border: 'none',
            color: '#6366f1', cursor: 'pointer', fontSize: '12px'
          }}>
            {expanded ? '▲ Show less' : '▼ Show more'}
          </button>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const [task, setTask] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [agentStates, setAgentStates] = useState<Record<string, { status: string; output: string }>>({});
  const [runStatus, setRunStatus] = useState<string>('');
  const [runId, setRunId] = useState<number | null>(null);
  const [pastRuns, setPastRuns] = useState<Run[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => { loadRuns(); }, []);

  async function loadRuns() {
    try {
      const runs = await getRuns();
      setPastRuns(runs.slice(0, 5));
    } catch (e) { console.error('Failed to load runs', e); }
  }

  function addLog(message: string) {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }

  function handleSubmit() {
    if (!task.trim() || isRunning) return;
    setIsRunning(true);
    setRunStatus('running');
    setAgentStates({});
    setLogs([]);
    setRunId(null);
    addLog('Connecting to server...');

    const ws = new WebSocket(getWebSocketUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      addLog('Connected! Sending task to agents...');
      ws.send(JSON.stringify({ task }));
    };

    ws.onmessage = (event) => {
      const data: AgentUpdate = JSON.parse(event.data);
      if (data.type === 'started') {
        setRunId(data.run_id || null);
        addLog(`Run #${data.run_id} started`);
      }
      if (data.type === 'agent_update') {
        const agent = data.agent || '';
        const status = data.status || '';
        const output = data.output || '';
        setAgentStates(prev => ({
          ...prev,
          [agent]: { status, output: output || prev[agent]?.output || '' }
        }));
        if (status === 'started') addLog(`🔄 ${agent} agent started...`);
        if (status === 'completed') addLog(`✅ ${agent} agent completed!`);
      }
      if (data.type === 'completed') {
        setRunStatus('completed');
        setIsRunning(false);
        addLog('🎉 All agents finished!');
        loadRuns();
      }
      if (data.type === 'error') {
        setRunStatus('failed');
        setIsRunning(false);
        addLog(`❌ Error: ${data.message}`);
      }
    };

    ws.onerror = () => {
      addLog('❌ WebSocket connection error');
      setIsRunning(false);
      setRunStatus('failed');
    };

    ws.onclose = () => { addLog('Connection closed'); };
  }

  const agents = [
    { key: 'research', name: 'Research', emoji: '🔍' },
    { key: 'coding',   name: 'Coding',   emoji: '💻' },
    { key: 'review',   name: 'Review',   emoji: '✅' },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#e2e8f0', marginBottom: '4px' }}>
          Agent Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Submit a task and watch 3 AI agents collaborate in real time
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Task input */}
          <div style={{
            background: '#1a1d2e', border: '1px solid #2d3148',
            borderRadius: '12px', padding: '20px'
          }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '13px' }}>
              Enter your task
            </label>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g. Write a Python function that finds the longest common subsequence of two strings"
              disabled={isRunning}
              style={{
                width: '100%', background: '#0f1117', border: '1px solid #2d3148',
                borderRadius: '8px', padding: '12px', color: '#e2e8f0',
                fontSize: '14px', resize: 'vertical', minHeight: '100px',
                outline: 'none', fontFamily: 'inherit'
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isRunning || !task.trim()}
              style={{
                marginTop: '12px', width: '100%', padding: '12px',
                background: isRunning ? '#2d3148' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: isRunning ? '#64748b' : 'white',
                border: 'none', borderRadius: '8px', fontSize: '15px',
                fontWeight: '600', cursor: isRunning ? 'not-allowed' : 'pointer'
              }}
            >
              {isRunning ? '⏳ Agents are working...' : '🚀 Run Agents'}
            </button>
          </div>

          {/* Agent cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {agents.map(agent => (
              <AgentCard
                key={agent.key}
                name={agent.name}
                emoji={agent.emoji}
                status={agentStates[agent.key]?.status || ''}
                output={agentStates[agent.key]?.output || ''}
              />
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Live log */}
          <div style={{
            background: '#1a1d2e', border: '1px solid #2d3148',
            borderRadius: '12px', padding: '16px'
          }}>
            <div style={{ marginBottom: '10px', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>
              📋 Live log
            </div>
            <div style={{
              background: '#0f1117', borderRadius: '8px', padding: '10px',
              minHeight: '200px', maxHeight: '300px', overflowY: 'auto',
              fontFamily: 'monospace', fontSize: '12px', color: '#64748b'
            }}>
              {logs.length === 0
                ? <span style={{ color: '#2d3148' }}>Waiting for task...</span>
                : logs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '4px', color: '#94a3b8' }}>{log}</div>
                  ))
              }
            </div>
          </div>

          {/* Run status */}
          {runId && (
            <div style={{
              background: '#1a1d2e', border: '1px solid #2d3148',
              borderRadius: '12px', padding: '16px'
            }}>
              <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Current run</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', fontWeight: '500' }}>Run #{runId}</span>
                <StatusBadge status={runStatus} />
              </div>
            </div>
          )}

          {/* Past runs */}
          <div style={{
            background: '#1a1d2e', border: '1px solid #2d3148',
            borderRadius: '12px', padding: '16px'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '12px'
            }}>
              <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Recent runs</span>
              <Link href="/history" style={{ color: '#6366f1', fontSize: '12px', textDecoration: 'none' }}>
                View all →
              </Link>
            </div>
            {pastRuns.length === 0
              ? <div style={{ color: '#2d3148', fontSize: '13px' }}>No runs yet</div>
              : pastRuns.map(run => (
                  <Link key={run.id} href={`/runs/${run.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '10px 0', borderBottom: '1px solid #2d3148', cursor: 'pointer'
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: '4px'
                      }}>
                        <span style={{ color: '#e2e8f0', fontSize: '13px' }}>Run #{run.id}</span>
                        <StatusBadge status={run.status} />
                      </div>
                      <div style={{
                        color: '#64748b', fontSize: '12px', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px'
                      }}>
                        {run.task}
                      </div>
                    </div>
                  </Link>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
