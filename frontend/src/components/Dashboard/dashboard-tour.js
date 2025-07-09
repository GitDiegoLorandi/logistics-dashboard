import React from 'react';
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
  const dashboardTourSteps = [
    {
      target: '.dashboard-header',
      content: 'Welcome to your logistics dashboard! This is where you can monitor all your delivery operations.',
      disableBeacon: true,
      placement: 'bottom',
      title: 'Dashboard Overview',
    },
    {
      target: '.dashboard-stats',
      content: 'Here you can see key metrics about your deliveries at a glance.',
      placement: 'bottom',
      title: 'Delivery Statistics',
    },
    {
      target: '.dashboard-chart',
      content: 'These charts show your delivery trends and performance over time.',
      placement: 'top',
      title: 'Performance Charts',
    },
    {
      target: '.dashboard-recent',
      content: 'View your most recent deliveries and their status here.',
      placement: 'top',
      title: 'Recent Deliveries',
    },
    {
      target: '.main-navigation',
      content: 'Use this navigation menu to access different sections of the application.',
      placement: 'right',
      title: 'Navigation Menu',
    },
    {
      target: '.user-menu',
      content: 'Access your profile, settings, and logout from here.',
      placement: 'bottom',
      title: 'User Menu',
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