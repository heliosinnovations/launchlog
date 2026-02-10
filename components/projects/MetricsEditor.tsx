'use client';

import { useState } from 'react';
import type { ProjectMetrics } from '@/types/project';
import { Button } from '@/components/ui/Button';

interface MetricsEditorProps {
  metrics: ProjectMetrics;
  onChange: (metrics: ProjectMetrics) => void;
}

export function MetricsEditor({ metrics, onChange }: MetricsEditorProps) {
  const [newKpiLabel, setNewKpiLabel] = useState('');
  const [newKpiValue, setNewKpiValue] = useState('');

  const updateField = <K extends keyof ProjectMetrics>(key: K, value: ProjectMetrics[K]) => {
    onChange({ ...metrics, [key]: value });
  };

  const addCustomKpi = () => {
    if (!newKpiLabel.trim() || !newKpiValue.trim()) return;
    const kpis = metrics.customKpis || [];
    updateField('customKpis', [...kpis, { label: newKpiLabel.trim(), value: newKpiValue.trim(), isPublic: true }]);
    setNewKpiLabel('');
    setNewKpiValue('');
  };

  const removeKpi = (index: number) => {
    const kpis = metrics.customKpis || [];
    updateField('customKpis', kpis.filter((_, i) => i !== index));
  };

  const toggleKpiVisibility = (index: number) => {
    const kpis = metrics.customKpis || [];
    const updated = kpis.map((kpi, i) => (i === index ? { ...kpi, isPublic: !kpi.isPublic } : kpi));
    updateField('customKpis', updated);
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Users Count */}
        <div>
          <label className="block text-sm font-medium mb-2">Users Count</label>
          <input
            type="number"
            value={metrics.usersCount ?? ''}
            onChange={(e) => updateField('usersCount', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 1000"
            className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Revenue */}
        <div>
          <label className="block text-sm font-medium mb-2">Revenue (USD)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={metrics.revenue ?? ''}
              onChange={(e) => updateField('revenue', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="e.g., 5000"
              className="flex-1 px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg focus:outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={() => updateField('revenuePublic', !metrics.revenuePublic)}
              className={`px-3 py-2 rounded-lg border text-sm ${
                metrics.revenuePublic
                  ? 'bg-success-500/10 border-success-500/20 text-success-400'
                  : 'bg-bg-tertiary border-border-default text-text-tertiary'
              }`}
              title={metrics.revenuePublic ? 'Public' : 'Private'}
            >
              {metrics.revenuePublic ? '👁️' : '🔒'}
            </button>
          </div>
        </div>

        {/* Launch Date */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-2">Launch Date</label>
          <input
            type="date"
            value={metrics.launchDate ?? ''}
            onChange={(e) => updateField('launchDate', e.target.value || undefined)}
            className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Custom KPIs */}
      <div>
        <label className="block text-sm font-medium mb-3">Custom KPIs</label>

        {metrics.customKpis && metrics.customKpis.length > 0 && (
          <ul className="space-y-2 mb-4">
            {metrics.customKpis.map((kpi, index) => (
              <li key={index} className="flex items-center gap-2 bg-bg-tertiary rounded-lg px-3 py-2">
                <span className="flex-1 font-medium">{kpi.label}:</span>
                <span className="text-text-secondary">{kpi.value}</span>
                <button
                  type="button"
                  onClick={() => toggleKpiVisibility(index)}
                  className="text-sm"
                  title={kpi.isPublic ? 'Public' : 'Private'}
                >
                  {kpi.isPublic ? '👁️' : '🔒'}
                </button>
                <button
                  type="button"
                  onClick={() => removeKpi(index)}
                  className="text-danger-400 hover:text-danger-300"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newKpiLabel}
            onChange={(e) => setNewKpiLabel(e.target.value)}
            placeholder="Label (e.g., MRR)"
            className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg focus:outline-none focus:border-brand-500 text-sm"
          />
          <input
            type="text"
            value={newKpiValue}
            onChange={(e) => setNewKpiValue(e.target.value)}
            placeholder="Value (e.g., $500)"
            className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg focus:outline-none focus:border-brand-500 text-sm"
          />
          <Button type="button" variant="secondary" size="sm" onClick={addCustomKpi}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
