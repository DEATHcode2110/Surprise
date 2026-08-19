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
import DailyDiaryScreen from './screens/DailyDiaryScreen';

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

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeDashboard onNavigate={setActiveTab} />;
      case 'log':
        return <DailyLogScreen />;
      case 'diary':
        return <DailyDiaryScreen />;
      case 'calendar':
        return <CalendarScreen onSelectDate={() => setActiveTab('log')} />;
      case 'insights':
        return <InsightsScreen />;
      case 'reminders':
        return <RemindersScreen />;
      case 'partner':
        return <SharedPartnerScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background relative">
      <AnimatedBowsBackground />
      <div className="relative z-10">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="max-w-4xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-28 sm:pb-12">
          {renderScreen()}
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
