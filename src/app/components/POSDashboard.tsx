import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Page } from '../App';
import { db } from '../lib/database';
import { Sidebar } from './Sidebar';

interface POSDashboardProps {
  onLogout: () => void;
  onNavigate: (page: Page) => void;
}

const peso = (amount: number) => `₱${amount.toFixed(2)}`;

export function POSDashboard({ onLogout, onNavigate }: POSDashboardProps) {
  const orders = db.all('orders');
  const orderItems = db.all('order_items');
  const tables = db.all('tables');
  const payments = db.all('payments');
  const paidOrders = orders.filter((order) => order.payment_status === 'Paid');
  const totalSales = paidOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const pendingPayments = orders.filter((order) => order.payment_status !== 'Paid' && order.dining_option === 'dine-in').length;
  const availableTables = tables.filter((table) => table.status === 'available').length;
  const occupiedTables = tables.filter((table) => table.status === 'occupied').length;

  const topItems = Object.values(
    orderItems
      .filter((item) => paidOrders.some((order) => order.id === item.order_id))
      .reduce<Record<string, { name: string; sold: number; revenue: number }>>((acc, item) => {
        const name = String(item.name);
        acc[name] ??= { name, sold: 0, revenue: 0 };
        acc[name].sold += Number(item.quantity ?? 0);
        acc[name].revenue += Number(item.quantity ?? 0) * Number(item.price ?? 0);
        return acc;
      }, {}),
  )
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const recentOrders = [...orders]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 5);

  const chartData = paidOrders.map((order) => ({
    id: String(order.id),
    total: Number(order.total ?? 0),
  }));

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="pos-dashboard" onNavigate={onNavigate} onLogout={onLogout} />

      <div className="flex-1 overflow-auto bg-background">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl text-primary mb-1">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Connected overview from orders, payments, and tables.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[
              ['Total Sales', peso(totalSales)],
              ['Total Orders', String(orders.length)],
              ['Pending Payments', String(pendingPayments)],
              ['Available Tables', String(availableTables)],
              ['Occupied Tables', String(occupiedTables)],
            ].map(([label, value]) => (
              <div key={label} className="bg-card rounded-xl shadow-sm border border-border p-5">
                <p className="text-sm text-muted-foreground mb-1">{label}</p>
                <h2 className="text-2xl text-primary">{value}</h2>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-border p-5">
              <h3 className="text-base text-primary mb-4">Sales Overview</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="id" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => peso(value)} />
                  <Bar dataKey="total" fill="#1F3E9A" />
                </BarChart>
              </ResponsiveContainer>
              {payments.length === 0 && <p className="text-sm text-muted-foreground mt-3">No paid orders yet.</p>}
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <h3 className="text-base text-primary mb-4">Top Orders</h3>
              <div className="space-y-3">
                {topItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Top orders appear after paid orders exist.</p>
                ) : (
                  topItems.map((item) => (
                    <div key={item.name} className="flex justify-between border-b border-border pb-2">
                      <div>
                        <p className="text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sold} sold</p>
                      </div>
                      <strong className="text-sm text-primary">{peso(item.revenue)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="text-base text-primary">Recent Orders</h3>
              <button onClick={() => onNavigate('order-list')} className="bg-secondary text-secondary-foreground px-5 py-2 rounded-lg hover:bg-secondary/90 transition-colors text-sm">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs">Customer Name</th>
                    <th className="px-4 py-3 text-left text-xs">Order Type</th>
                    <th className="px-4 py-3 text-left text-xs">Table</th>
                    <th className="px-4 py-3 text-left text-xs">Total</th>
                    <th className="px-4 py-3 text-left text-xs">Payment Status</th>
                    <th className="px-4 py-3 text-left text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={String(order.id)} className="border-t border-border hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">{String(order.id)}</td>
                      <td className="px-4 py-3 text-sm">{String(order.customer_name)}</td>
                      <td className="px-4 py-3 text-sm">{order.dining_option === 'dine-in' ? 'Dine-In' : 'Takeout'}</td>
                      <td className="px-4 py-3 text-sm">{order.table_number ? String(order.table_number) : '-'}</td>
                      <td className="px-4 py-3 text-sm">{peso(Number(order.total ?? 0))}</td>
                      <td className="px-4 py-3 text-sm">{String(order.payment_status)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => onNavigate('order-list')} className="text-primary text-sm hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No orders saved yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
