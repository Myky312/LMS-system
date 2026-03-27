import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Password } from "primereact/password";
import { loginRequest } from "@/lib/api/login";
import { isLoggedIn, setSession } from "@/lib/auth/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 6;

function formatLoginError(err: unknown): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response &&
    err.response.data &&
    typeof err.response.data === "object"
  ) {
    const data = err.response.data as { message?: unknown };
    const { message } = data;
    if (Array.isArray(message)) return message.map(String).join(", ");
    if (typeof message === "string") return message;
  }
  return "Sign in failed. Check your email and password.";
}

function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Email is required.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "Password is required.";
  if (value.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  return null;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const emailError = useMemo(() => validateEmail(email), [email]);
  const passwordError = useMemo(() => validatePassword(password), [password]);

  const canSubmit =
    emailError === null &&
    passwordError === null &&
    email.trim().length > 0 &&
    password.length > 0;

  if (isLoggedIn()) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouchedEmail(true);
    setTouchedPassword(true);
    setServerError(null);
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await loginRequest(email.trim(), password);
      setSession(res.accessToken, res.refreshToken, res.user);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg = formatLoginError(err);
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen align-items-center justify-content-center p-4"
      style={{ background: "var(--surface-ground)" }}
    >
      <Card
        title="Sign in"
        subTitle="ZeekrAcademy"
        className="w-full shadow-2 border-round-xl"
        style={{ maxWidth: 420 }}
      >
        <form
          onSubmit={onSubmit}
          className="login-form p-fluid flex flex-column gap-4 w-full"
        >
          {serverError && <Message severity="error" text={serverError} className="w-full" />}

          <div className="flex flex-column gap-2 w-full">
            <label htmlFor="email" className="text-sm m-0" style={{ color: "var(--text-color)" }}>
              Email
            </label>
            <InputText
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              invalid={touchedEmail && !!emailError}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouchedEmail(true)}
              placeholder="you@example.com"
            />
            {touchedEmail && emailError && (
              <small className="p-error block mt-1">{emailError}</small>
            )}
          </div>

          <div className="flex flex-column gap-2 w-full">
            <label htmlFor="password" className="text-sm m-0" style={{ color: "var(--text-color)" }}>
              Password
            </label>
            <Password
              inputId="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouchedPassword(true)}
              toggleMask
              feedback={false}
              invalid={touchedPassword && !!passwordError}
              placeholder="Enter your password"
              className="w-full"
              inputClassName="w-full"
            />
            {touchedPassword && passwordError && (
              <small className="p-error block mt-1">{passwordError}</small>
            )}
          </div>

          <div className="flex justify-content-end">
            <Link to="/forgot-password" className="text-sm no-underline" style={{ color: "var(--primary-color)" }}>
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            label="Log in"
            icon="pi pi-sign-in"
            className="w-full"
            loading={submitting}
            disabled={!canSubmit || submitting}
          />
        </form>
      </Card>
    </div>
  );
}
