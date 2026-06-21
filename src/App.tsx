import { useState } from 'react';
import { Sidebar, ViewState } from './components/Sidebar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DashboardHome } from './components/DashboardHome';
import { InventoryManagement } from './components/InventoryManagement';
import { StaffScheduling } from './components/StaffScheduling';
import { LoginPage } from './components/LoginPage';
import bgImage from "/src/assets/images/pub_background_1781992732386.jpg";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-[#0B0D11] text-gray-200 font-sans overflow-hidden selection:bg-amber-500/30 selection:text-amber-500 print:bg-white print:text-black print:h-auto print:block print:overflow-visible">
       <div className="absolute inset-0 z-[-1] bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}>
          <div className="absolute inset-0 bg-[#0B0D11]/80 backdrop-blur-[1.5px]"></div>
       </div>
       <div className="print:hidden">
          <Sidebar 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            isSidebarOpen={isSidebarOpen} 
            setIsSidebarOpen={setIsSidebarOpen} 
          />
       </div>
       <div className="flex-1 flex flex-col overflow-hidden relative isolate print:overflow-visible">
          <div className="print:hidden">
             <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          </div>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative z-0 print:overflow-visible print:p-0">
             {currentView === 'dashboard' && <DashboardHome setCurrentView={setCurrentView} />}
             {currentView === 'inventory' && <InventoryManagement />}
             {currentView === 'scheduling' && <StaffScheduling />}
          </main>
          <Footer />
       </div>
    </div>
  );
}
