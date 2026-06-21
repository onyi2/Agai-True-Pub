import { cn } from "../lib/utils";
import { LayoutDashboard, Package, Users, Settings, LogOut, Wine } from "lucide-react";
import logo from "/src/assets/images/agai_logo_1781992158822.jpg";
import { Brand } from "./Brand";
import { motion } from "motion/react";

export type ViewState = 'dashboard' | 'inventory' | 'scheduling';

type SidebarProps = {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
};

export function Sidebar({ currentView, setCurrentView, isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Stock & Sales', icon: Package },
    { id: 'scheduling', label: 'Staff Schedule', icon: Users },
  ];

  return (
    <>
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-[#15181E] border-r border-gray-800 flex flex-col z-50 transition-transform duration-300 transform md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 pb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.img 
              src={logo} 
              alt="AGAI True Pub Logo" 
              className="w-12 h-12 rounded shadow-md border border-amber-500/10 cursor-pointer" 
              animate={{
                y: [0, -6, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              whileHover={{ scale: 1.1, rotate: [0, -2, 2, 0] }}
              whileTap={{ scale: 0.95 }}
            />
            <Brand />
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id as ViewState);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={cn(
                 "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium border border-transparent",
                 currentView === item.id 
                   ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                   : "text-gray-400 hover:bg-gray-800"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

      <div className="p-6 mt-auto border-t border-gray-800">
         <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium text-gray-400 hover:bg-gray-800">
                <Settings className="w-5 h-5" />
                Settings
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium text-red-500 hover:bg-red-900/20">
                <LogOut className="w-5 h-5" />
                Logout
            </button>
         </div>
      </div>
    </aside>
    {isSidebarOpen && (
      <div 
        className="md:hidden fixed inset-0 bg-black/50 z-40" 
        onClick={() => setIsSidebarOpen(false)}
      ></div>
    )}
    </>
  );
}
