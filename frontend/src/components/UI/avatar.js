import React from 'react';
import PropTypes from 'prop-types';

/**
 * Avatar component for user profiles
 */
const Avatar = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
      {...props}
    />
  );
});

Avatar.displayName = 'Avatar';

/**
 * Avatar image component
 */
const AvatarImage = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <img
      ref={ref}
      className={`aspect-square h-full w-full object-cover ${className}`}
      {...props}
    />
  );
});

AvatarImage.displayName = 'AvatarImage';

/**
 * Avatar fallback component for when image is not available
 */
const AvatarFallback = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground ${className}`}
      {...props}
    />
  );
});

AvatarFallback.displayName = 'AvatarFallback';

// PropTypes
Avatar.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

AvatarImage.propTypes = {
  className: PropTypes.string,
  src: PropTypes.string,
  alt: PropTypes.string,
};

AvatarFallback.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

export { Avatar, AvatarImage, AvatarFallback }; 