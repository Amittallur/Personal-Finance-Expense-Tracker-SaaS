import React, { useState } from 'react';
import { Card, CardBody, Input, Button } from '@heroui/react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

const registerSchema = Yup.object({
  name: Yup.string().trim().required('Full name is required').max(60, 'Name too long'),
  email: Yup.string().email('Please enter a valid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showSuccess } = useToast();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      setErrorMsg(null);
      setIsSubmitting(true);
      try {
        await register(values.name, values.email, values.password);
        showSuccess('Account created successfully! Welcome to Centra.');
        navigate('/');
      } catch (err: any) {
        setErrorMsg(err.message || 'Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <Card className="max-w-[440px] w-full border border-border shadow-sm bg-content1 rounded-2xl">
        <CardBody className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl mb-3 shadow-md shadow-primary/20">
              ₵
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Create your account</h1>
            <p className="text-xs text-foreground-500 mt-1">
              Start tracking, budgeting, and optimizing your wealth today
            </p>
          </div>

          {/* Google SSO Button */}
          <div className="mb-4">
            <GoogleSignInButton text="signup_with" />
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-3 text-[11px] font-medium text-foreground-400 uppercase tracking-wider">
              Or register with email
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
              id="name"
              name="name"
              label="Full Name"
              labelPlacement="outside"
              placeholder="Alex Morgan"
              variant="bordered"
              radius="md"
              size="md"
              startContent={<User size={16} className="text-foreground-400" />}
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              isInvalid={formik.touched.name && Boolean(formik.errors.name)}
              errorMessage={formik.touched.name && formik.errors.name}
              classNames={{
                inputWrapper: 'border-border hover:border-foreground-400 focus-within:!border-primary',
                label: 'text-xs font-medium text-foreground-600',
              }}
            />

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
              placeholder="Create a strong password"
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

            <Input
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              labelPlacement="outside"
              placeholder="Confirm your password"
              variant="bordered"
              radius="md"
              size="md"
              startContent={<Lock size={16} className="text-foreground-400" />}
              type={isVisible ? 'text' : 'password'}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              isInvalid={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              errorMessage={formik.touched.confirmPassword && formik.errors.confirmPassword}
              classNames={{
                inputWrapper: 'border-border hover:border-foreground-400 focus-within:!border-primary',
                label: 'text-xs font-medium text-foreground-600',
              }}
            />

            <Button
              type="submit"
              color="primary"
              variant="solid"
              fullWidth
              size="md"
              isLoading={isSubmitting}
              endContent={!isSubmitting && <UserPlus size={16} />}
              className="font-semibold text-sm h-10 mt-2 shadow-sm"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-foreground-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

