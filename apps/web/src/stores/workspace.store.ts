import { create } from 'zustand';
import type { Workspace } from '@bulksend/shared';

interface WorkspaceState {
  workspace: Workspace | null;
  setWorkspace: (ws: Workspace) => void;
  clear: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  workspace: null,
  setWorkspace: (workspace) => set({ workspace }),
  clear: () => set({ workspace: null }),
}));
