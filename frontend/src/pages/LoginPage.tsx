import {
  type FormEvent,
  useState,
} from "react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const {
    user,
    login,
  } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState(
    "manager@teampulse.dev",
  );

  const [password, setPassword] = useState(
    "TeamPulse@123",
  );

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({
        email,
        password,
      });

      navigate("/dashboard", {
        replace: true,
      });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Login failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="brand-mark">
          <span>TP</span>
        </div>

        <div>
          <p className="eyebrow">
            Weekly intelligence platform
          </p>

          <h1>
            Turn weekly updates into team momentum.
          </h1>

          <p className="auth-brand-copy">
            TeamPulse gives every contributor a clear
            voice and gives managers the insight needed
            to remove blockers quickly.
          </p>
        </div>

        <div className="auth-stat-grid">
          <article>
            <strong>One</strong>
            <span>consistent report format</span>
          </article>

          <article>
            <strong>Real-time</strong>
            <span>team visibility</span>
          </article>

          <article>
            <strong>Secure</strong>
            <span>structured review workflow</span>
          </article>
        </div>
      </section>

      <section className="auth-form-panel">
        <form
          className="auth-card"
          onSubmit={handleSubmit}
        >
          <div className="auth-card-heading">
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to TeamPulse</h2>
            <p>
              Access your reports, reviews and team
              insights.
            </p>
          </div>

          {error && (
            <div
              className="alert alert-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <label className="form-field">
            <span>Email address</span>

            <div className="input-with-icon">
              <Mail size={18} />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="form-field">
            <span>Password</span>

            <div className="input-with-icon">
              <LockKeyhole size={18} />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                required
              />

              <button
                className="icon-button"
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
                aria-label="Show or hide password"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Signing in..."
              : "Sign in"}
          </button>

          <p className="auth-switch">
            New team member?{" "}
            <Link to="/register">
              Create an account
            </Link>
          </p>

          <div className="demo-note">
            <strong>Demo manager</strong>
            <span>manager@teampulse.dev</span>
            <span>TeamPulse@123</span>
          </div>
        </form>
      </section>
    </main>
  );
}