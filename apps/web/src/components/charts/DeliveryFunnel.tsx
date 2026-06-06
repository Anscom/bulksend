interface FunnelStep {
  label: string;
  value: number;
  total: number;
  color: string;
}

interface DeliveryFunnelProps {
  steps: FunnelStep[];
}

export function DeliveryFunnel({ steps }: DeliveryFunnelProps) {
  return (
    <div className="funnel">
      {steps.map((step) => {
        const pct = step.total > 0 ? Math.round((step.value / step.total) * 100) : 0;
        return (
          <div key={step.label} className="fr">
            <div className="frt">
              <span className="fn">{step.label}</span>
              <span className="fv"><b>{step.value.toLocaleString()}</b> · {pct}%</span>
            </div>
            <div className="ftrack">
              <div
                className="ffill"
                style={{ width: `${pct}%`, background: step.color }}
              >
                {pct > 10 && `${pct}%`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
