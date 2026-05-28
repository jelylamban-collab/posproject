import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { POSDashboard } from './components/POSDashboard';
import { CreateOrder } from './components/CreateOrder';
import { TableManagement } from './components/TableManagement';
import { Payment } from './components/Payment';
import { Receipt } from './components/Receipt';
import { OrderList } from './components/OrderList';
import { Reports } from './components/Reports';

export type UserRole = 'admin' | 'staff' | 'cashier' | null;

export type OrderItem = {
  id?: number;
  name: string;
  price: number;
  quantity: number;
  orderType?: 'dine-in' | 'takeout';
  notes?: string;
  ingredients?: { name: string; quantity: number; unit: string }[];
  originalIngredients?: { name: string; quantity: number; unit: string }[];
};

export type POSOrder = {
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  discountType?: 'none' | 'senior' | 'pwd' | 'promo' | 'custom';
  serviceFee?: number;
  tax?: number;
  total?: number;
  orderType: 'dine-in' | 'takeout';
  timestamp?: Date;
  paid?: boolean;
  tableNumber?: number | null;
};

export type Page =
  | 'login'
  | 'admin-dashboard'
  | 'pos-dashboard'
  | 'create-order'
  | 'table-management'
  | 'payment'
  | 'receipt'
  | 'order-list'
  | 'reports';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [, setUserRole] = useState<UserRole>(null);
  const [currentOrder, setCurrentOrder] = useState<POSOrder | null>(null);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    if (role === 'admin') {
      setCurrentPage('admin-dashboard');
    } else {
      setCurrentPage('pos-dashboard');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentPage('login');
    setCurrentOrder(null);
  };

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  return (
    <div className="size-full bg-background">
      {currentPage === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}
      {currentPage === 'admin-dashboard' && (
        <AdminDashboard onLogout={handleLogout} />
      )}
      {currentPage === 'pos-dashboard' && (
        <POSDashboard onLogout={handleLogout} onNavigate={navigateTo} />
      )}
      {currentPage === 'create-order' && (
        <CreateOrder onNavigate={navigateTo} onOrderCreated={setCurrentOrder} />
      )}
      {currentPage === 'table-management' && (
        <TableManagement onNavigate={navigateTo} currentOrder={currentOrder} />
      )}
      {currentPage === 'payment' && (
        <Payment onNavigate={navigateTo} currentOrder={currentOrder} />
      )}
      {currentPage === 'receipt' && (
        <Receipt onNavigate={navigateTo} currentOrder={currentOrder} />
      )}
      {currentPage === 'order-list' && (
        <OrderList onNavigate={navigateTo} onLogout={handleLogout} />
      )}
      {currentPage === 'reports' && (
        <Reports onNavigate={navigateTo} onLogout={handleLogout} />
      )}
    </div>
  );
}
