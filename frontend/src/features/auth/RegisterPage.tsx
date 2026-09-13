import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../../api/endpoints/auth";
import { extractErrorMessage } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";
import "./AuthLayout.css";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[a-z]/, "Add a lowercase letter")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[0-9]/, "Add a number"),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const { user, accessToken } = await authApi.register({ ...values, timezone });
      setSession(user, accessToken);
      toast.success("Account created — let's build some momentum");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not create account"));
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
          <h1>Small progress every day becomes a completely different life.</h1>
          <p>Set up flexible habits, protect your streaks with real vacation mode, and let the data show your growth.</p>
        </motion.div>
        <div className="auth-hero-stats">
          <div>
            <strong>Free</strong>
            <span>No credit card</span>
          </div>
          <div>
            <strong>2 min</strong>
            <span>To get set up</span>
          </div>
          <div>
            <strong>Private</strong>
            <span>Your data, your account</span>
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
          <h2>Create your account</h2>
          <p>Start your productivity operating system.</p>

          <form className="stack" style={{ gap: 16 }} onSubmit={handleSubmit(onSubmit)}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" className="input" placeholder="Alex Morgan" {...register("name")} />
              {errors.name && <span className="error-text">{errors.name.message}</span>}
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <span className="error-text">{errors.email.message}</span>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" className="input" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <span className="error-text">{errors.password.message}</span>}
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ marginTop: 4 }}>
              {submitting ? "Creating account…" : "Create account"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-form-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
