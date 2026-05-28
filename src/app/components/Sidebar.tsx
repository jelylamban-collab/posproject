import { Home, ShoppingCart, List, BarChart3, LogOut, Users, UtensilsCrossed } from 'lucide-react';
import type { Page } from '../App';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

export function Sidebar({ currentPage, onNavigate, onLogout, isAdmin = false }: SidebarProps) {
  const adminMenuItems = [
    { icon: Users, label: 'User Management', page: 'admin-dashboard' as Page },
  ];

  const staffMenuItems = [
    { icon: Home, label: 'Dashboard', page: 'pos-dashboard' as Page },
    { icon: ShoppingCart, label: 'Create Order', page: 'create-order' as Page },
    { icon: List, label: 'Order List', page: 'order-list' as Page },
    { icon: UtensilsCrossed, label: 'Table Management', page: 'table-management' as Page },
    { icon: BarChart3, label: 'Reports', page: 'reports' as Page },
  ];

  const menuItems = isAdmin ? adminMenuItems : staffMenuItems;

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-xl text-sidebar-foreground">Restaurant POS</h2>
        <p className="text-sm text-sidebar-foreground/70 mt-1">
          {isAdmin ? 'Admin Panel' : 'Staff Panel'}
        </p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.page}>
              <button
                onClick={() => onNavigate(item.page)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.page
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
