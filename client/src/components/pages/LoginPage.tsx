import { useNavigate } from "react-router-dom";
import z from "zod"
import { useAuthStore } from "../../store/authStore";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginApi } from "../../api/auth.api";

import { AxiosError } from 'axios';
import { ArrowRightIcon, EyeIcon, EyeSlashIcon, WarningIcon } from "@phosphor-icons/react";

// -------------------------------------------------------------------------------------
// FORM SCHEMA
// Validates email format and minimum password length before hitting the API
// -------------------------------------------------------------------------------------
const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormValues = z.infer<typeof loginSchema>;


// -------------------------------------------------------------------------------------
// LOGIN PAGE
// The only public page in the app - all other routes require authentication
// -------------------------------------------------------------------------------------
const LoginPage = () => {

  const navigate = useNavigate();
  const { login } = useAuthStore(); // function from Zustand to store user + token

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  // This runs when the form is submitted.
  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    try {
      const response = await loginApi(data);

      // Save token and user to Zustand store + localStorage
      login(response.token, response.user);

      // Redirect to dashboard on success
      navigate('/dashboard');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {           
        const message =
          error.response?.data?.message ?? 'Something went wrong. Please try again.';
        setApiError(message);
      } else {
        setApiError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* ----- Brand Header --------------------------------------------------- */}
        <div className="text-center mb-8">
          <h1 className="text-[#E8A120] text-3xl font-bold tracking-widest mb-1">
            LEAPBACK
          </h1>
          <p className="text-white/50 text-sm">E-Quotation Portal</p>
        </div>

        {/* ----- Login Card --------------------------------------------------- */}
        <div className="bg-white px-8 py-10 rounded-2xl shadow-2xl">

          <div className="mb-7">
            <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">
              Sign in to your staff account to continue.
            </p>
          </div>

          {/* API error message */}
          {apiError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
              <WarningIcon size={16} weight="fill" className="shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@leapback.ng"
                {...register('email')}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors
                  ${errors.email
                    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-300 bg-white focus:border-[#E8A120] focus:ring-2 focus:ring-[#E8A120]/20'
                  }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full px-4 py-2.5 pr-11 rounded-lg border text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors
                    ${errors.password
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 bg-white focus:border-[#E8A120] focus:ring-2 focus:ring-[#E8A120]/20'
                    }`}
                />
                {/* Toggle password visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeSlashIcon size={18} className="cursor-pointer" />
                    : <EyeIcon size={18} className="cursor-pointer" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0A0F1E] text-[#E8A120] font-semibold py-2.5 rounded-lg text-sm hover:bg-[#0A0F1E]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                'Signing in...'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRightIcon size={18} />
                </span>
              )}
            </button>

          </form>

        </div>

        {/* ----- Footer note --------------------------------------------------- */}
        <p className="text-center text-white/30 text-xs mt-6">
          quote.leapback.ng · Staff access only
        </p>

      </div>

    </div>
  )
}

export default LoginPage