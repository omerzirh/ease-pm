import { describe, it, expect, beforeEach } from 'vitest';
import { useSidebarStore } from '../useSidebarStore';

describe('useSidebarStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSidebarStore.setState({
      isCollapsed: false,
      isMobileOpen: false,
      showSettingsSubmenu: false,
      activeSettingsTab: 'labels',
    });
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useSidebarStore.getState();

      expect(state.isCollapsed).toBe(false);
      expect(state.isMobileOpen).toBe(false);
      expect(state.showSettingsSubmenu).toBe(false);
      expect(state.activeSettingsTab).toBe('labels');
    });
  });

  describe('toggleCollapsed', () => {
    it('should toggle isCollapsed from false to true', () => {
      const { toggleCollapsed } = useSidebarStore.getState();

      toggleCollapsed();

      expect(useSidebarStore.getState().isCollapsed).toBe(true);
    });

    it('should toggle isCollapsed from true to false', () => {
      useSidebarStore.setState({ isCollapsed: true });
      const { toggleCollapsed } = useSidebarStore.getState();

      toggleCollapsed();

      expect(useSidebarStore.getState().isCollapsed).toBe(false);
    });
  });

  describe('setMobileOpen', () => {
    it('should set isMobileOpen to true', () => {
      const { setMobileOpen } = useSidebarStore.getState();

      setMobileOpen(true);

      expect(useSidebarStore.getState().isMobileOpen).toBe(true);
    });

    it('should set isMobileOpen to false', () => {
      useSidebarStore.setState({ isMobileOpen: true });
      const { setMobileOpen } = useSidebarStore.getState();

      setMobileOpen(false);

      expect(useSidebarStore.getState().isMobileOpen).toBe(false);
    });
  });

  describe('setShowSettingsSubmenu', () => {
    it('should set showSettingsSubmenu to true', () => {
      const { setShowSettingsSubmenu } = useSidebarStore.getState();

      setShowSettingsSubmenu(true);

      expect(useSidebarStore.getState().showSettingsSubmenu).toBe(true);
    });

    it('should set showSettingsSubmenu to false', () => {
      useSidebarStore.setState({ showSettingsSubmenu: true });
      const { setShowSettingsSubmenu } = useSidebarStore.getState();

      setShowSettingsSubmenu(false);

      expect(useSidebarStore.getState().showSettingsSubmenu).toBe(false);
    });
  });

  describe('setActiveSettingsTab', () => {
    it('should set activeSettingsTab to a new value', () => {
      const { setActiveSettingsTab } = useSidebarStore.getState();

      setActiveSettingsTab('ai');

      expect(useSidebarStore.getState().activeSettingsTab).toBe('ai');
    });

    it('should update activeSettingsTab from one value to another', () => {
      useSidebarStore.setState({ activeSettingsTab: 'labels' });
      const { setActiveSettingsTab } = useSidebarStore.getState();

      setActiveSettingsTab('gitlab');

      expect(useSidebarStore.getState().activeSettingsTab).toBe('gitlab');
    });
  });

  describe('resetMobileState', () => {
    it('should reset isMobileOpen to false', () => {
      useSidebarStore.setState({ isMobileOpen: true });
      const { resetMobileState } = useSidebarStore.getState();

      resetMobileState();

      expect(useSidebarStore.getState().isMobileOpen).toBe(false);
    });

    it('should reset isMobileOpen to false when already false', () => {
      useSidebarStore.setState({ isMobileOpen: false });
      const { resetMobileState } = useSidebarStore.getState();

      resetMobileState();

      expect(useSidebarStore.getState().isMobileOpen).toBe(false);
    });

    it('should not affect other state properties', () => {
      useSidebarStore.setState({
        isCollapsed: true,
        isMobileOpen: true,
        showSettingsSubmenu: true,
        activeSettingsTab: 'ai',
      });
      const { resetMobileState } = useSidebarStore.getState();

      resetMobileState();

      const state = useSidebarStore.getState();
      expect(state.isCollapsed).toBe(true);
      expect(state.isMobileOpen).toBe(false);
      expect(state.showSettingsSubmenu).toBe(true);
      expect(state.activeSettingsTab).toBe('ai');
    });
  });

  describe('persistence', () => {
    it('should persist isCollapsed state to localStorage', () => {
      const { toggleCollapsed } = useSidebarStore.getState();

      toggleCollapsed();

      const persistedData = localStorage.getItem('ease-gitlab-sidebar');
      expect(persistedData).toBeTruthy();

      const parsed = JSON.parse(persistedData!);
      expect(parsed.state.isCollapsed).toBe(true);
    });

    it('should not persist isMobileOpen state', () => {
      const { setMobileOpen } = useSidebarStore.getState();

      setMobileOpen(true);

      const persistedData = localStorage.getItem('ease-gitlab-sidebar');
      if (persistedData) {
        const parsed = JSON.parse(persistedData);
        expect(parsed.state.isMobileOpen).toBeUndefined();
      }
    });

    it('should not persist showSettingsSubmenu state', () => {
      const { setShowSettingsSubmenu } = useSidebarStore.getState();

      setShowSettingsSubmenu(true);

      const persistedData = localStorage.getItem('ease-gitlab-sidebar');
      if (persistedData) {
        const parsed = JSON.parse(persistedData);
        expect(parsed.state.showSettingsSubmenu).toBeUndefined();
      }
    });

    it('should not persist activeSettingsTab state', () => {
      const { setActiveSettingsTab } = useSidebarStore.getState();

      setActiveSettingsTab('ai');

      const persistedData = localStorage.getItem('ease-gitlab-sidebar');
      if (persistedData) {
        const parsed = JSON.parse(persistedData);
        expect(parsed.state.activeSettingsTab).toBeUndefined();
      }
    });

    it('should restore isCollapsed state from localStorage', () => {
      const { toggleCollapsed } = useSidebarStore.getState();
      toggleCollapsed();

      const persistedData = localStorage.getItem('ease-gitlab-sidebar');
      expect(persistedData).toBeTruthy();

      const parsed = JSON.parse(persistedData!);
      expect(parsed.state.isCollapsed).toBe(true);

      expect(useSidebarStore.getState().isCollapsed).toBe(true);
    });

    it('should handle missing localStorage gracefully', () => {
      localStorage.clear();

      const state = useSidebarStore.getState();

      expect(state.isCollapsed).toBe(false);
      expect(state.isMobileOpen).toBe(false);
      expect(state.showSettingsSubmenu).toBe(false);
      expect(state.activeSettingsTab).toBe('labels');
    });
  });
});
