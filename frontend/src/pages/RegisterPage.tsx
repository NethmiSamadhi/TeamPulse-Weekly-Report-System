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
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const {
    user,
    register,
  } = useAuth();

  const navigate = useNavigate();

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

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

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        fullName,
        email,
        password,
      });

      navigate("/dashboard", {
        replace: true,
      });
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "Registration failed",
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
            Join your team
          </p>

          <h1>
            Make every week visible and valuable.
          </h1>

          <p className="auth-brand-copy">
            Create structured updates, highlight
            achievements and surface blockers before
            they slow down your team.
          </p>
        </div>

        <div className="auth-stat-grid">
          <article>
            <strong>Clear</strong>
            <span>weekly priorities</span>
          </article>

          <article>
            <strong>Simple</strong>
            <span>manager feedback</span>
          </article>

          <article>
            <strong>Visible</strong>
            <span>progress and achievements</span>
          </article>
        </div>
      </section>

      <section className="auth-form-panel">
        <form
          className="auth-card"
          onSubmit={handleSubmit}
        >
          <div className="auth-card-heading">
            <p className="eyebrow">
              Team member registration
            </p>

            <h2>Create your account</h2>

            <p>
              New accounts securely begin with the
              Team Member role.
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <label className="form-field">
            <span>Full name</span>

            <div className="input-with-icon">
              <UserRound size={18} />

              <input
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                autoComplete="name"
                required
              />
            </div>
          </label>

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
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </label>

          <label className="form-field">
            <span>Confirm password</span>

            <div className="input-with-icon">
              <LockKeyhole size={18} />

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </label>

          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Creating account..."
              : "Create account"}
          </button>

          <p className="auth-switch">
            Already registered?{" "}
            <Link to="/login">
              Sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}