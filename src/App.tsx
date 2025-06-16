import React, { useState } from 'react';
import WelcomePage from './components/WelcomePage';
import RegistrationPage from './components/RegistrationPage';
import CalendarConnectionPage from './components/CalendarConnectionPage';
import Dashboard from './components/Dashboard';

export type OnboardingStep = 'welcome' | 'registration' | 'calendar' | 'dashboard';

export interface User {
  name: string;
  email: string;
  calendarConnected: boolean;
  calendarType?: 'google' | 'apple';
}

function App() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [user, setUser] = useState<User | null>(null);

  const handleStepChange = (step: OnboardingStep) => {
    setCurrentStep(step);
  };

  const handleUserRegistration = (userData: Omit<User, 'calendarConnected'>) => {
    setUser({
      ...userData,
      calendarConnected: false
    });
  };

  const handleCalendarConnection = (calendarType: 'google' | 'apple') => {
    if (user) {
      setUser({
        ...user,
        calendarConnected: true,
        calendarType
      });
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomePage onNext={() => handleStepChange('registration')} />;
      case 'registration':
        return (
          <RegistrationPage
            onNext={(userData) => {
              handleUserRegistration(userData);
              handleStepChange('calendar');
            }}
          />
        );
      case 'calendar':
        return (
          <CalendarConnectionPage
            onConnect={(calendarType) => {
              handleCalendarConnection(calendarType);
              handleStepChange('dashboard');
            }}
            onSkip={() => handleStepChange('dashboard')}
          />
        );
      case 'dashboard':
        return <Dashboard user={user} />;
      default:
        return <WelcomePage onNext={() => handleStepChange('registration')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {renderCurrentStep()}
    </div>
  );
}

export default App;