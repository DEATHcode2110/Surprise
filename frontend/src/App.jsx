import React, { useState } from 'react';
import { TrackerProvider, useTracker } from './context/TrackerContext';
import Navbar from './components/Navbar';
import PasswordLockScreen from './components/PasswordLockScreen';
import AnimatedBowsBackground from './components/AnimatedBowsBackground';
import HomeDashboard from './screens/HomeDashboard';
import DailyLogScreen from './screens/DailyLogScreen';
import RemindersScreen from './screens/RemindersScreen';
import SharedPartnerScreen from './screens/SharedPartnerScreen';
import InsightsScreen from './screens/InsightsScreen';
import CalendarScreen from './screens/CalendarScreen';
import ProfileScreen from './screens/ProfileScreen';

function AppContent() {
  const { isLocked } = useTracker();
  const [activeTab, setActiveTab] = useState('home');

  if (isLocked) {
    return (
      <div className="min-h-screen bg-background text-on-background relative">
        <AnimatedBowsBackground />
        <PasswordLockScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background relative">
      <AnimatedBowsBackground />
      <div className="relative z-10">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="max-w-4xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-28 sm:pb-12">
          <div className={activeTab === 'home' ? 'block' : 'hidden'}>
            <HomeDashboard onNavigate={setActiveTab} />
          </div>
          <div className={activeTab === 'log' ? 'block' : 'hidden'}>
            <DailyLogScreen />
          </div>
          <div className={activeTab === 'calendar' ? 'block' : 'hidden'}>
            <CalendarScreen onSelectDate={() => setActiveTab('log')} />
          </div>
          <div className={activeTab === 'insights' ? 'block' : 'hidden'}>
            <InsightsScreen />
          </div>
          <div className={activeTab === 'reminders' ? 'block' : 'hidden'}>
            <RemindersScreen />
          </div>
          <div className={activeTab === 'partner' ? 'block' : 'hidden'}>
            <SharedPartnerScreen />
          </div>
          <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
            <ProfileScreen />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TrackerProvider>
      <AppContent />
    </TrackerProvider>
  );
}
