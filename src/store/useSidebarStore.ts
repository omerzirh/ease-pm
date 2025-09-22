import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  showSettingsSubmenu: boolean;
  toggleCollapsed: (val?: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  setShowSettingsSubmenu: (show: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      showSettingsSubmenu: false,
      toggleCollapsed: (value) => set((state) => ({ isCollapsed: value || !state.isCollapsed })),
      setMobileOpen: (open) => set({ isMobileOpen: open }),
      setShowSettingsSubmenu: (show) => set({ showSettingsSubmenu: show }),
    }),
    {
      name: 'ease-gitlab-sidebar',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);
