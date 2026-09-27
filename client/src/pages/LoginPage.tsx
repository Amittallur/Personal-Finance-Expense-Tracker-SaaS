import React, { useState } from 'react';
import { Card, CardBody, Input, Button, Checkbox, Divider } from '@heroui/react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const loginSchema = Yup.object({
  email: Yup.string().email('Please enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess } = useToast();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      remember: true,
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setErrorMsg(null);
      setIsSubmitting(true);
      try {
        await login(values.email, values.password);
        showSuccess('Welcome back!');
        navigate('/');
      } catch (err: any) {
        setErrorMsg(err.message || 'Login failed. Please check your credentials.');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleDemoLogin = async () => {
    formik.setFieldValue('email', 'demo@example.com');
    formik.setFieldValue('password', 'Password123!');
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login('demo@example.com', 'Password123!');
      showSuccess('Logged in as Demo User');
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <Card className="max-w-[420px] w-full border border-border shadow-sm bg-content1 rounded-2xl">
        <CardBody className="p-6 sm:p-8">
          {/* Logo & Heading */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl mb-3 shadow-md shadow-primary/20">
              ₵
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-xs text-foreground-500 mt-1">
              Sign in to your Centra financial dashboard
            </p>
          </div>

          {/* Quick Demo Login Banner */}
          <Button
            variant="flat"
            color="primary"
            fullWidth
            onPress={handleDemoLogin}
            isLoading={isSubmitting}
            startContent={!isSubmitting && <Sparkles size={16} className="text-primary" />}
            className="mb-5 font-semibold text-xs h-10 border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            One-Click Demo Account Login
          </Button>

          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-3 text-[11px] font-medium text-foreground-400 uppercase tracking-wider">
              Or continue with email
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs font-medium">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address"
              labelPlacement="outside"
              placeholder="name@example.com"
              variant="bordered"
              radius="md"
              size="md"
              startContent={<Mail size={16} className="text-foreground-400" />}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              isInvalid={formik.touched.email && Boolean(formik.errors.email)}
              errorMessage={formik.touched.email && formik.errors.email}
              classNames={{
                inputWrapper: 'border-border hover:border-foreground-400 focus-within:!border-primary',
                label: 'text-xs font-medium text-foreground-600',
              }}
            />

            <Input
              id="password"
              name="password"
              label="Password"
              labelPlacement="outside"
              placeholder="Enter your password"
              variant="bordered"
              radius="md"
              size="md"
              startContent={<Lock size={16} className="text-foreground-400" />}
              endContent={
                <button
                  type="button"
                  onClick={toggleVisibility}
                  className="focus:outline-none text-foreground-400 hover:text-foreground-600"
                >
                  {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              type={isVisible ? 'text' : 'password'}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              isInvalid={formik.touched.password && Boolean(formik.errors.password)}
              errorMessage={formik.touched.password && formik.errors.password}
              classNames={{
                inputWrapper: 'border-border hover:border-foreground-400 focus-within:!border-primary',
                label: 'text-xs font-medium text-foreground-600',
              }}
            />

            <div className="flex items-center justify-between mt-1">
              <Checkbox
                id="remember"
                name="remember"
                isSelected={formik.values.remember}
                onValueChange={(val) => formik.setFieldValue('remember', val)}
                size="sm"
                color="primary"
                classNames={{
                  label: 'text-xs text-foreground-500 font-normal',
                }}
              >
                Remember session
              </Checkbox>
            </div>

            <Button
              type="submit"
              color="primary"
              variant="solid"
              fullWidth
              size="md"
              isLoading={isSubmitting}
              endContent={!isSubmitting && <ArrowRight size={16} />}
              className="font-semibold text-sm h-10 mt-1 shadow-sm"
            >
              Sign In
            </Button>
          </form>

          {/* Footer link to register */}
          <div className="mt-6 text-center">
            <p className="text-xs text-foreground-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary hover:underline transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

