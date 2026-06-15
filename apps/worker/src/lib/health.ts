type ConsumerName = 'dispatcher' | 'sender' | 'eventWorker' | 'dlqMonitor';

const state: Record<ConsumerName, boolean> = {
  dispatcher: false,
  sender: false,
  eventWorker: false,
  dlqMonitor: false,
};

export function markUp(name: ConsumerName): void { state[name] = true; }
export function markDown(name: ConsumerName): void { state[name] = false; }
export function allHealthy(): boolean { return Object.values(state).every(Boolean); }
export function healthState(): Record<string, boolean> { return { ...state }; }
