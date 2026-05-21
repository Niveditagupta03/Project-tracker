import { Suspense } from 'react';
import DashboardContent from '../components/DashboardContent';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="dashboard-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <div className="loading" style={{ fontSize: '0.9rem', color: '#64748B' }}>Loading Dashboard...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
