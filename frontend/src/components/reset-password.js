import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Package, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from './UI/button';
import { cn } from '../lib/utils';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resetToken, setResetToken] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract token from URL query params
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    
    if (!token) {
      toast.error('Invalid or missing reset token');
      navigate('/forgot-password');
      return;
    }
    
    setResetToken(token);
  }, [location.search, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      // In a real app, this would call an API endpoint
      // await authAPI.resetPassword({ 
      //   token: resetToken, 
      //   password: formData.password 
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResetComplete(true);
      toast.success('Password has been reset successfully');
    } catch (error) {
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 grid place-items-center p-4">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Logistics Dashboard</h1>
          </div>

          {!resetComplete ? (
            <>
              <h2 className="text-xl font-semibold text-center mb-2">Create New Password</h2>
              <p className="text-center text-muted-foreground mb-8">
                Enter a new password for your account
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="p-4 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm">
                    {errors.general}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={cn(
                        "w-full pl-10 pr-10 py-2 h-10 border rounded-md bg-background",
                        errors.password
                          ? "border-destructive focus:ring-destructive/30"
                          : "border-input focus:border-ring focus:ring-ring/30"
                      )}
                      placeholder="Enter new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={cn(
                        "w-full pl-10 pr-10 py-2 h-10 border rounded-md bg-background",
                        errors.confirmPassword
                          ? "border-destructive focus:ring-destructive/30"
                          : "border-input focus:border-ring focus:ring-ring/30"
                      )}
                      placeholder="Confirm new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-destructive text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Resetting Password...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                <Check className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Password Reset Complete</h2>
              <p className="text-muted-foreground mb-6">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <Button 
                className="w-full" 
                onClick={handleLoginClick}
              >
                Go to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 