const SIDEBAR_KEY = 'practice.sidebarCollapsed'

export function loadSidebarCollapsedDefault(): boolean {
  const raw = localStorage.getItem(SIDEBAR_KEY)
  return raw === null ? true : raw === 'true'
}

export function saveSidebarCollapsedDefault(collapsed: boolean): void {
  localStorage.setItem(SIDEBAR_KEY, String(collapsed))
}
