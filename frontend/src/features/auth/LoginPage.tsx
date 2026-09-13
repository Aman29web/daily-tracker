import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../../api/endpoints/auth";
import { extractErrorMessage } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";
import "./AuthLayout.css";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { user, accessToken } = await authApi.login(values);
      setSession(user, accessToken);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not log in"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="auth-hero-brand">
          <div className="auth-hero-brand-mark">
            <Sparkles size={18} />
          </div>
          Momentum
        </div>
        <motion.div
          className="auth-hero-copy"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1>Your personal productivity operating system.</h1>
          <p>
            Plan your habits, protect your streaks, and see — with real data — whether you're becoming better than you
            were last week.
          </p>
        </motion.div>
        <div className="auth-hero-stats">
          <div>
            <strong>Plan</strong>
            <span>Flexible schedules</span>
          </div>
          <div>
            <strong>Track</strong>
            <span>Streaks &amp; scores</span>
          </div>
          <div>
            <strong>Reflect</strong>
            <span>Insights that don't lie</span>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <motion.div
          className="auth-form-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2>Welcome back</h2>
          <p>Log in to pick up where you left off.</p>

          <form className="stack" style={{ gap: 16 }} onSubmit={handleSubmit(onSubmit)}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <span className="error-text">{errors.email.message}</span>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  className="input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="btn btn-icon"
                  style={{ position: "absolute", right: 4, top: 4, padding: 6 }}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password.message}</span>}
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ marginTop: 4 }}>
              {submitting ? "Logging in…" : "Log in"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-form-footer">
            New to Momentum? <Link to="/register">Create an account</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
