import { Card } from "primereact/card";

export function DashboardPage() {
  return (
    <main className="p-4 md:p-6" style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 className="text-3xl m-0 mb-2">Dashboard</h1>
      <p className="text-color-secondary mt-0 mb-4">You are signed in. Extend this page with your LMS widgets.</p>
      <div className="grid">
        <div className="col-12 md:col-4">
          <Card title="Courses" className="h-full">
            <p className="m-0 text-color-secondary">Overview placeholder</p>
          </Card>
        </div>
        <div className="col-12 md:col-4">
          <Card title="Learners" className="h-full">
            <p className="m-0 text-color-secondary">Overview placeholder</p>
          </Card>
        </div>
        <div className="col-12 md:col-4">
          <Card title="Activity" className="h-full">
            <p className="m-0 text-color-secondary">Overview placeholder</p>
          </Card>
        </div>
      </div>
    </main>
  );
}
