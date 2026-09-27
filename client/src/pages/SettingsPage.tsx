import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/endpoints';

const profileSchema = Yup.object({
  name: Yup.string().trim().required('Name is required').max(60),
  currency: Yup.string().required('Currency is required'),
  theme: Yup.string().required('Theme is required'),
  dateFormat: Yup.string().required('Date format is required'),
});

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string().min(6, 'New password must be at least 6 characters').required('New password is required'),
  confirmNewPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { setColorMode } = useColorMode();
  const { showSuccess, showError } = useToast();

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Profile Formik
  const profileFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      currency: user?.preferences?.currency || 'INR',
      theme: user?.preferences?.theme || 'light',
      dateFormat: user?.preferences?.dateFormat || 'DD/MM/YYYY',
    },
    validationSchema: profileSchema,
    onSubmit: async (values) => {
      setIsUpdatingProfile(true);
      try {
        await authApi.updateProfile({
          name: values.name,
          preferences: {
            currency: values.currency as any,
            theme: values.theme as any,
            dateFormat: values.dateFormat as any,
          },
        });
        setColorMode(values.theme as any);
        await refreshUser();
        showSuccess('Preferences updated successfully');
      } catch (err: any) {
        showError(err.message || 'Failed to update preferences');
      } finally {
        setIsUpdatingProfile(false);
      }
    },
  });

  // Password Formik
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    validationSchema: passwordSchema,
    onSubmit: async (values) => {
      setIsChangingPassword(true);
      setPasswordSuccess(null);
      try {
        await authApi.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        setPasswordSuccess('Password changed successfully');
        passwordFormik.resetForm();
        showSuccess('Password updated successfully');
      } catch (err: any) {
        showError(err.message || 'Failed to change password');
      } finally {
        setIsChangingPassword(false);
      }
    },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your personal profile, currency formatting, and security
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile & Preferences Form */}
        <div className="md:col-span-7 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Profile & Preferences
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Customise your name, currency symbol, and regional preferences
          </p>

          <form onSubmit={profileFormik.handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                value={profileFormik.values.name}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                isInvalid={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                errorMessage={profileFormik.touched.name && profileFormik.errors.name}
                variant="bordered"
                size="md"
                classNames={{
                  input: 'text-xs',
                  inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                }}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                isDisabled
                value={profileFormik.values.email}
                variant="bordered"
                size="md"
                classNames={{
                  input: 'text-xs text-slate-400',
                  inputWrapper: 'rounded-xl border-slate-200/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50',
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Currency
                </label>
                <Select
                  aria-label="Currency"
                  selectedKeys={[profileFormik.values.currency]}
                  onChange={(e) => profileFormik.setFieldValue('currency', e.target.value)}
                  variant="bordered"
                  size="md"
                  classNames={{ trigger: 'rounded-xl border-slate-200 dark:border-slate-800' }}
                >
                  <SelectItem key="INR" textValue="INR">₹ INR (India)</SelectItem>
                  <SelectItem key="USD" textValue="USD">$ USD (US)</SelectItem>
                  <SelectItem key="EUR" textValue="EUR">€ EUR (Euro)</SelectItem>
                  <SelectItem key="GBP" textValue="GBP">£ GBP (UK)</SelectItem>
                  <SelectItem key="CAD" textValue="CAD">CA$ CAD</SelectItem>
                  <SelectItem key="AUD" textValue="AUD">AU$ AUD</SelectItem>
                  <SelectItem key="SGD" textValue="SGD">SG$ SGD</SelectItem>
                  <SelectItem key="AED" textValue="AED">AED Emirates</SelectItem>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Theme
                </label>
                <Select
                  aria-label="Theme"
                  selectedKeys={[profileFormik.values.theme]}
                  onChange={(e) => profileFormik.setFieldValue('theme', e.target.value)}
                  variant="bordered"
                  size="md"
                  classNames={{ trigger: 'rounded-xl border-slate-200 dark:border-slate-800' }}
                >
                  <SelectItem key="light" textValue="Light">Light Mode</SelectItem>
                  <SelectItem key="dark" textValue="Dark">Dark Mode</SelectItem>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Date Format
                </label>
                <Select
                  aria-label="Date Format"
                  selectedKeys={[profileFormik.values.dateFormat]}
                  onChange={(e) => profileFormik.setFieldValue('dateFormat', e.target.value)}
                  variant="bordered"
                  size="md"
                  classNames={{ trigger: 'rounded-xl border-slate-200 dark:border-slate-800' }}
                >
                  <SelectItem key="DD/MM/YYYY" textValue="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem key="MM/DD/YYYY" textValue="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem key="YYYY-MM-DD" textValue="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </Select>
              </div>
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                color="primary"
                size="sm"
                isLoading={isUpdatingProfile}
                className="font-medium"
              >
                Save Preferences
              </Button>
            </div>
          </form>
        </div>

        {/* Security & Password Form */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Security
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Update your account password
            </p>

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-700 dark:text-emerald-400">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={passwordFormik.handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Current Password
                </label>
                <Input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordFormik.values.currentPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  isInvalid={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
                  errorMessage={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
                  variant="bordered"
                  size="md"
                  classNames={{
                    input: 'text-xs',
                    inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordFormik.values.newPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  isInvalid={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                  errorMessage={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
                  variant="bordered"
                  size="md"
                  classNames={{
                    input: 'text-xs',
                    inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  value={passwordFormik.values.confirmNewPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  isInvalid={passwordFormik.touched.confirmNewPassword && Boolean(passwordFormik.errors.confirmNewPassword)}
                  errorMessage={passwordFormik.touched.confirmNewPassword && passwordFormik.errors.confirmNewPassword}
                  variant="bordered"
                  size="md"
                  classNames={{
                    input: 'text-xs',
                    inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                  }}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="bordered"
                  size="sm"
                  isLoading={isChangingPassword}
                  className="w-full text-xs font-medium border-slate-200 dark:border-slate-800"
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>

          {/* Session Logout */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
            <h3 className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
              Active Session
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Signed in as <strong className="text-slate-800 dark:text-slate-200">{user?.email}</strong>. Logging out clears your HTTP-only cookie.
            </p>
            <Button
              color="danger"
              variant="flat"
              size="sm"
              onPress={() => logout()}
              className="text-xs font-medium"
            >
              Log Out of Centra
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
