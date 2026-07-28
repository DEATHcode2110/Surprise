import React from 'react';

export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'log', label: 'Daily Log', icon: 'edit_note' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar_month' },
    { id: 'insights', label: 'Insights', icon: 'insights' },
    { id: 'reminders', label: 'Reminders', icon: 'notifications_active' },
    { id: 'partner', label: 'Partner', icon: 'favorite' },
    { id: 'profile', label: 'Details', icon: 'person' }
  ];

  return (
    <header className="sticky top-0 z-40 glass-card border-b border-primary-container/40 px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand Logo with Ribbon/Bow Theme */}
        <div className="flex items-center space-x-2 cursor-pointer select-none" onClick={() => setActiveTab('home')}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-container/80 flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-xl sm:text-2xl">favorite</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-bold font-headline text-primary tracking-tight">Bloom</h1>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-secondary-container text-secondary font-bold">Shared</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-outline font-medium">Cycle & Period Tracking</p>
          </div>
        </div>

        {/* Navigation Ribbon for Desktop */}
        <nav className="hidden sm:flex items-center gap-1 bg-surface-container-low p-1.5 rounded-full border border-primary-container/30">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-md'
                    : 'text-outline hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Bottom Navigation Ribbon */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-bright/95 backdrop-blur-lg border-t border-primary-container/50 px-1 py-1.5 flex justify-between items-center shadow-2xl overflow-x-auto no-scrollbar">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-1 px-1.5 rounded-2xl transition-all flex-1 min-w-[50px] active:scale-95 ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <div className={`p-1 rounded-full transition-all ${isActive ? 'bg-primary-container text-primary shadow-sm scale-110' : ''}`}>
                <span className="material-symbols-outlined text-xl">{tab.icon}</span>
              </div>
              <span className={`text-[9px] mt-0.5 whitespace-nowrap tracking-tight ${isActive ? 'font-bold text-primary' : 'font-medium text-outline'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
