import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Package, Mail, ArrowLeft, Check } from 'lucide-react';
import { Button } from './UI/button';
import { cn } from '../lib/utils';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const validateEmail = () => {
    if (!email) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setLoading(true);
    
    try {
      // In a real app, this would call an API endpoint
      // await authAPI.forgotPassword({ email });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      let errorMessage = 'Failed to send reset instructions. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-card shadow-lg">
        <div className="p-8">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Logistics Dashboard</h1>
          </div>

          {!submitted ? (
            <>
              <h2 className="mb-2 text-center text-xl font-semibold">Reset Your Password</h2>
              <p className="mb-8 text-center text-muted-foreground">
                Enter your email address and we'll send you instructions to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={handleChange}
                      className={cn(
                        "w-full pl-10 pr-4 py-2 h-10 border rounded-md bg-background",
                        error
                          ? "border-destructive focus:ring-destructive/30"
                          : "border-input focus:border-ring focus:ring-ring/30"
                      )}
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <p className="mt-1 text-xs text-destructive">{error}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
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
                      Sending...
                    </div>
                  ) : (
                    "Send Reset Instructions"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-8 w-8" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">Check Your Email</h2>
              <p className="mb-6 text-muted-foreground">
                We've sent password reset instructions to:
                <br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/login')}
              >
                Return to Login
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 