import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-screen align-items-center justify-content-center p-4"
      style={{ background: "var(--surface-ground)" }}
    >
      <Card title="Forgot password?" className="w-full" style={{ maxWidth: 420 }}>
        <p className="text-color-secondary line-height-3 mb-3">
          Password reset is not available in the app yet. Please contact your administrator or use
          the credentials provided for your environment.
        </p>
        <Message severity="info" text="Tip: default dev accounts are listed in the backend migration seed files." className="w-full mb-3" />
        <Button
          label="Back to sign in"
          icon="pi pi-arrow-left"
          className="w-full"
          outlined
          type="button"
          onClick={() => navigate("/login")}
        />
      </Card>
    </div>
  );
}
