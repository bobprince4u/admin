import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";

type AuthMode = "login" | "signup";

interface LoginFormProps {
  onSuccess: () => void;
  onSignupClick: () => void;
  allowSignup?: boolean;
}

export function LoginForm({
  onSuccess,
  onSignupClick,
  allowSignup = true,
}: LoginFormProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [signupDisabled, setSignupDisabled] = useState(false);

  // 🔒 Hide signup forever once completed
  useEffect(() => {
    const disabled = localStorage.getItem("signupDisabled");
    if (disabled === "true") {
      setSignupDisabled(true);
      setMode("login");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Direct URLs for login and signup
    const endpoint =
      mode === "login"
        ? "https://api.accian.co.uk/api/admin/login"
        : "https://api.accian.co.uk/api/admin/create";

    try {
      // Prepare request body based on mode
      const body =
        mode === "login"
          ? { email, password }
          : {
              email,
              password,
              fullName: email.split("@")[0].replace(/[._]/g, " "), // Generate name from email
              username: email.split("@")[0],
              role: "admin",
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      // Make sure data.data exists
      const accessToken = data?.data?.accessToken;
      const user = data?.data?.user;

      if (!accessToken) throw new Error("No access token returned from server");

      // Store token first
      localStorage.setItem("adminToken", accessToken);
      if (user) localStorage.setItem("adminUser", JSON.stringify(user));

      // ✅ Permanently disable signup after success
      if (mode === "signup") {
        localStorage.setItem("signupDisabled", "true");
        setSignupDisabled(true);
        setMode("login");
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="p-8"
    >
      <h1 className="mb-8">
        {mode === "login" ? "Admin Login" : "Admin Signup"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-slate-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-slate-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-12 pr-12 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="ml-2 text-slate-700">Remember me</span>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 text-center bg-red-50 py-2 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : mode === "login" ? (
            "Login"
          ) : (
            "Create Account"
          )}
        </button>

        {/* Signup toggle (PERMANENTLY REMOVED AFTER SIGNUP) */}
        {!signupDisabled && allowSignup && mode === "login" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-4 border-t border-slate-200"
          >
            <p className="text-center text-slate-600 mb-3">
              Don&apos;t have an account?
            </p>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                onSignupClick();
              }}
              className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg"
            >
              Sign Up
            </button>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
}
