import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AnimatedBowsBackground from './components/AnimatedBowsBackground';
import HomeDashboard from './screens/HomeDashboard';
import DailyLogScreen from './screens/DailyLogScreen';
import RemindersScreen from './screens/RemindersScreen';
import SharedPartnerScreen from './screens/SharedPartnerScreen';
import InsightsScreen from './screens/InsightsScreen';
import CalendarScreen from './screens/CalendarScreen';
import ProfileScreen from './screens/ProfileScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeDashboard onNavigate={setActiveTab} />;
      case 'log':
        return <DailyLogScreen />;
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
        <main className="max-w-4xl mx-auto px-4 pt-6">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}
