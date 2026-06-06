interface VolumeChartProps {
  data: Array<{ delivered: number; opened: number }>;
  labels: string[];
}

export function VolumeChart({ data, labels }: VolumeChartProps) {
  const max = Math.max(...data.map((d) => d.delivered));

  return (
    <>
      <div className="chart-bars" id="volChart">
        {data.map((d, i) => (
          <div key={i} className="cb" title={`${d.delivered.toLocaleString()} delivered`}>
            <span className="bar b2" style={{ height: `${(d.opened / max) * 100}%` }} />
            <span className="bar" style={{ height: `${((d.delivered - d.opened) / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="chart-x">
        {labels.map((l, i) => <span key={i}>{l}</span>)}
      </div>
    </>
  );
}
