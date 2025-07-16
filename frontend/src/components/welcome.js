import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

const Welcome = () => {
  const { t } = useTranslation(['welcome', 'common']);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      title: t('steps.welcome.title'),
      description: t('steps.welcome.description'),
      image: '🚚',
    },
    {
      title: t('steps.track.title'),
      description: t('steps.track.description'),
      image: '📦',
    },
    {
      title: t('steps.manage.title'),
      description: t('steps.manage.description'),
      image: '👥',
    },
    {
      title: t('steps.analyze.title'),
      description: t('steps.analyze.description'),
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
          <h1 className="text-xl font-bold">{t('common.app.title', { ns: 'common' })}</h1>
        </div>
        <Button variant="ghost" onClick={handleSkip}>
          {t('skip')}
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
                  {t('next')} <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  {t('getStarted')} <CheckCircle className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>{t('footer', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
};

export default Welcome; 