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
      <Card title="Забыли пароль?" className="w-full" style={{ maxWidth: 420 }}>
        <p className="text-color-secondary line-height-3 mb-3">
          Восстановление пароля в приложении пока недоступно. Обратитесь к администратору или используйте
          учётные данные, выданные для вашей среды.
        </p>
        <Message
          severity="info"
          text="Подсказка: тестовые учётные записи для разработки указаны в файлах миграций и сидов бэкенда."
          className="w-full mb-3"
        />
        <Button
          label="Назад ко входу"
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
