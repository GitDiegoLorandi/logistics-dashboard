import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Button } from './UI/button';
import { cn } from '../lib/utils';
import { Eye, EyeOff, Lock, Mail, Package } from 'lucide-react';
import LanguageSwitcher from './UI/language-switcher';

const Login = () => {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  React.useEffect(() => {
    if (localStorage.getItem('authToken')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = t('login.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('login.errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('login.errors.passwordRequired');
    }

    return newErrors;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await authAPI.login(formData);

      // Explicitly store token and user data in localStorage
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
      } else {
        console.warn('No token received in login response');
      }

      toast.success(t('login.welcome', { name: response.user?.name || response.user?.email || t('common.user') }));
      navigate('/dashboard');
    } catch (error) {
      let errorMessage = t('login.errors.generic');

      if (error.status) {
        // Using the normalized error object from our enhanced API
        errorMessage = error.message || 
          t('login.errors.server', { status: error.status });
      } else if (error.request) {
        // Network error
        errorMessage = t('login.errors.network');
      } else {
        // Request setup error
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='grid min-h-screen place-items-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4'>
      <div className='w-full max-w-md overflow-hidden rounded-lg bg-card shadow-lg'>
        <div className='p-8'>
          <div className='mb-6 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Package className='h-8 w-8 text-primary' />
              <h1 className='text-2xl font-bold'>{t('app.title', { ns: 'common' })}</h1>
            </div>
            <LanguageSwitcher />
          </div>

          <p className='mb-8 text-center text-muted-foreground'>
            {t('login.subtitle')}
          </p>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {errors.general && (
              <div className='rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive'>
                {errors.general}
              </div>
            )}

            <div className='space-y-2'>
              <label htmlFor='email' className='text-sm font-medium'>
                {t('login.email')}
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  className={cn(
                    'w-full pl-10 pr-4 py-2 h-10 border rounded-md bg-background',
                    errors.email
                      ? 'border-destructive focus:ring-destructive/30'
                      : 'border-input focus:border-ring focus:ring-ring/30'
                  )}
                  placeholder={t('login.emailPlaceholder', { defaultValue: 'Enter your email' })}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className='mt-1 text-xs text-destructive'>{errors.email}</p>
              )}
            </div>

            <div className='space-y-2'>
              <label htmlFor='password' className='text-sm font-medium'>
                {t('login.password')}
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  className={cn(
                    'w-full pl-10 pr-10 py-2 h-10 border rounded-md bg-background',
                    errors.password
                      ? 'border-destructive focus:ring-destructive/30'
                      : 'border-input focus:border-ring focus:ring-ring/30'
                  )}
                  placeholder={t('login.passwordPlaceholder', { defaultValue: 'Enter your password' })}
                  disabled={loading}
                />
                <button
                  type='button'
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className='mt-1 text-xs text-destructive'>
                  {errors.password}
                </p>
              )}
            </div>

            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? (
                <div className='flex items-center justify-center'>
                  <svg
                    className='-ml-1 mr-2 h-4 w-4 animate-spin text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  {t('login.signingIn')}
                </div>
              ) : (
                t('login.signIn')
              )}
            </Button>
          </form>

          <div className='mt-8 border-t border-border pt-6'>
            <div className='rounded-md bg-muted/50 p-4 text-center text-xs text-muted-foreground'>
              <strong className='mb-1 block'>{t('login.demoCredentials')}:</strong>
              {t('login.adminCredentials', { defaultValue: 'Admin: admin@example.com / password123' })}
              <br />
              {t('login.userCredentials', { defaultValue: 'User: user@example.com / senha123' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
