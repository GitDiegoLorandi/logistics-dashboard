import React from 'react';
import { useTranslation } from 'react-i18next';
import OnboardingTour from '../UI/onboarding-tour';

/**
 * DashboardTour component for guiding users through the dashboard
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.run - Whether to run the tour
 * @param {Function} props.onFinish - Callback when tour finishes
 * @param {Function} props.onSkip - Callback when tour is skipped
 */
const DashboardTour = ({ run = false, onFinish, onSkip }) => {
  const { t } = useTranslation(['dashboard', 'common']);
  
  const dashboardTourSteps = [
    {
      target: '.dashboard-header',
      content: t('tour.welcome'),
      disableBeacon: true,
      placement: 'bottom',
      title: t('tour.overviewTitle'),
    },
    {
      target: '.dashboard-stats',
      content: t('tour.statsContent'),
      placement: 'bottom',
      title: t('tour.statsTitle'),
    },
    {
      target: '.dashboard-chart',
      content: t('tour.chartsContent'),
      placement: 'top',
      title: t('tour.chartsTitle'),
    },
    {
      target: '.dashboard-recent',
      content: t('tour.recentContent'),
      placement: 'top',
      title: t('tour.recentTitle'),
    },
    {
      target: '.main-navigation',
      content: t('tour.navigationContent'),
      placement: 'right',
      title: t('tour.navigationTitle'),
    },
    {
      target: '.user-menu',
      content: t('tour.userMenuContent'),
      placement: 'bottom',
      title: t('tour.userMenuTitle'),
    },
  ];

  return (
    <OnboardingTour
      steps={dashboardTourSteps}
      run={run}
      onFinish={onFinish}
      onSkip={onSkip}
      tourId="dashboard-tour"
    />
  );
};

export default DashboardTour; 