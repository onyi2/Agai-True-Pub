import { Bell, Search, User, Menu } from "lucide-react";

type HeaderProps = {
  toggleSidebar: () => void;
};

export function Header({ toggleSidebar }: HeaderProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="h-20 bg-[#0B0D11] border-b border-gray-800 flex items-center justify-between px-6 md:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
         <button onClick={toggleSidebar} className="md:hidden p-2 text-gray-500 hover:bg-gray-800 rounded-lg">
            <Menu className="w-6 h-6" />
         </button>
         <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-gray-200">Agai True Pub</h2>
            <p className="text-xs text-gray-500 font-medium">{today}</p>
         </div>
      </div>

      <div className="flex items-center gap-3 flex-1 md:flex-none justify-end md:gap-6">
         <div className="relative hidden md:block group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-[#15181E] border border-gray-800 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all w-64 placeholder:text-gray-600 text-gray-200"
            />
         </div>
         <button className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0B0D11]"></span>
         </button>
         <div className="h-8 w-px bg-gray-800 hidden md:block"></div>
         <button className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-gray-800 transition-colors">
           <div className="w-8 h-8 rounded bg-amber-600 flex items-center justify-center text-xs font-bold text-white">
              BA
           </div>
           <div className="text-left hidden lg:block">
             <p className="text-sm font-medium text-gray-200 leading-tight">Brian Agai</p>
             <p className="text-[10px] text-gray-500 leading-tight">General Manager</p>
           </div>
         </button>
      </div>
    </header>
  );
}
