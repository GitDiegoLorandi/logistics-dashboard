import React from 'react';
import PropTypes from 'prop-types';
import Joyride, { STATUS } from 'react-joyride';

/**
 * OnboardingTour component for creating guided tours
 * Uses react-joyride under the hood
 */
const OnboardingTour = ({
  steps = [],
  run = false,
  onFinish,
  onSkip,
  continuous = true,
  showProgress = true,
  showSkipButton = true,
  tourId = 'app-tour',
  ...props
}) => {
  const handleCallback = (data) => {
    const { status, type } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour is complete or skipped
      if (status === STATUS.FINISHED && onFinish) {
        onFinish();
      } else if (status === STATUS.SKIPPED && onSkip) {
        onSkip();
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={continuous}
      showProgress={showProgress}
      showSkipButton={showSkipButton}
      callback={handleCallback}
      disableScrolling={true}
      disableOverlayClose={true}
      styles={{
        options: {
          primaryColor: 'var(--color-primary)',
          backgroundColor: 'var(--color-card)',
          textColor: 'var(--color-foreground)',
          arrowColor: 'var(--color-card)',
          zIndex: 1000,
        },
        spotlight: {
          backgroundColor: 'transparent',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonBack: {
          marginRight: 10,
        },
        buttonSkip: {
          color: 'var(--color-muted-foreground)',
        },
      }}
      {...props}
    />
  );
};

OnboardingTour.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      target: PropTypes.string.isRequired,
      content: PropTypes.node.isRequired,
      title: PropTypes.string,
      placement: PropTypes.string,
      disableBeacon: PropTypes.bool,
    })
  ).isRequired,
  run: PropTypes.bool,
  onFinish: PropTypes.func,
  onSkip: PropTypes.func,
  continuous: PropTypes.bool,
  showProgress: PropTypes.bool,
  showSkipButton: PropTypes.bool,
  tourId: PropTypes.string,
};

export default OnboardingTour; 