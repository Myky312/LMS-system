import { Card } from "primereact/card";

export function DashboardPage() {
  return (
    <main className="p-4 md:p-6" style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 className="text-3xl m-0 mb-2">Главная</h1>
      <p className="text-color-secondary mt-0 mb-4">
        Вы вошли в систему. На этой странице позже появятся виджеты LMS.
      </p>
      <div className="grid">
        <div className="col-12 md:col-4">
          <Card title="Курсы" className="h-full">
            <p className="m-0 text-color-secondary">Заглушка обзора</p>
          </Card>
        </div>
        <div className="col-12 md:col-4">
          <Card title="Учащиеся" className="h-full">
            <p className="m-0 text-color-secondary">Заглушка обзора</p>
          </Card>
        </div>
        <div className="col-12 md:col-4">
          <Card title="Активность" className="h-full">
            <p className="m-0 text-color-secondary">Заглушка обзора</p>
          </Card>
        </div>
      </div>
    </main>
  );
}
