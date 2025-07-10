import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from './UI/button';

const Welcome = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      title: 'Welcome to Logistics Dashboard',
      description: 'Your complete solution for managing deliveries and logistics operations.',
      image: '🚚',
    },
    {
      title: 'Track Deliveries',
      description: 'Monitor all your deliveries in real-time with detailed status updates and location tracking.',
      image: '📦',
    },
    {
      title: 'Manage Resources',
      description: 'Efficiently manage your deliverers, vehicles, and other resources to optimize operations.',
      image: '👥',
    },
    {
      title: 'Analyze Performance',
      description: 'Get comprehensive analytics and reports to improve your logistics operations.',
      image: '📊',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // On last step, redirect to login
      navigate('/login');
    }
  };

  const handleSkip = () => {
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/10 to-secondary/10">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Logistics Dashboard</h1>
        </div>
        <Button variant="ghost" onClick={handleSkip}>
          Skip
        </Button>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Progress indicator */}
          <div className="mb-8 flex justify-center">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`mx-1 h-2 w-16 rounded-full transition-all ${
                  index <= currentStep ? 'bg-primary' : 'bg-primary/20'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="rounded-lg bg-card p-8 text-center shadow-lg">
            <div className="mb-6 text-5xl">{steps[currentStep].image}</div>
            <h2 className="mb-4 text-2xl font-bold">{steps[currentStep].title}</h2>
            <p className="mb-8 text-muted-foreground">{steps[currentStep].description}</p>

            <Button onClick={handleNext} className="w-full">
              {currentStep < steps.length - 1 ? (
                <>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Get Started <CheckCircle className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Logistics Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Welcome; 