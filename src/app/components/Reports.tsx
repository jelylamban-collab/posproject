import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, Printer } from 'lucide-react';
import type { Page } from '../App';
import { db } from '../lib/database';
import { Sidebar } from './Sidebar';

interface ReportsProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const peso = (amount: number) => `₱${amount.toFixed(2)}`;

export function Reports({ onNavigate, onLogout }: ReportsProps) {
  const [search, setSearch] = useState('');
  const [orderType, setOrderType] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const transactions = useMemo(() => {
    const orders = db.all('orders');
    return db.all('payments').map((payment) => {
      const order = orders.find((record) => record.id === payment.order_id);
      const receipt = db.all('receipts').find((record) => record.payment_id === payment.id);
      const createdAt = new Date(String(payment.paid_at ?? new Date().toISOString()));
      return {
        date: createdAt.toISOString().slice(0, 10),
        orderId: String(payment.order_id),
        receiptId: String(receipt?.id ?? ''),
        customerName: String(order?.customer_name ?? ''),
        orderType: order?.dining_option === 'dine-in' ? 'Dine-In' : 'Takeout',
        subtotal: Number(order?.subtotal ?? 0),
        serviceFee: Number(order?.service_fee ?? 0),
        tax: Number(order?.tax ?? 0),
        discount: Number(order?.discount ?? 0),
        totalPaid: Number(payment.amount_due ?? 0),
        paymentMethod: String(payment.method ?? 'Cash'),
        status: String(payment.status ?? 'Paid'),
      };
    });
  }, []);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.orderId.includes(search) || transaction.receiptId.toLowerCase().includes(search.toLowerCase());
    const matchesType = orderType === 'all' || transaction.orderType === orderType;
    const matchesPayment = paymentStatus === 'all' || transaction.status === paymentStatus;
    const matchesMethod = paymentMethod === 'all' || transaction.paymentMethod === paymentMethod;
    const matchesDate = !dateFilter || transaction.date === dateFilter;
    return matchesSearch && matchesType && matchesPayment && matchesMethod && matchesDate;
  });

  const refunds = db.all('refunds');
  const totalRevenue = filteredTransactions
    .filter((transaction) => transaction.status === 'Paid')
    .reduce((sum, transaction) => sum + transaction.totalPaid, 0);
  const totalDiscounts = filteredTransactions.reduce((sum, transaction) => sum + transaction.discount, 0);
  const totalTax = filteredTransactions.reduce((sum, transaction) => sum + transaction.tax, 0);
  const totalServiceFees = filteredTransactions.reduce((sum, transaction) => sum + transaction.serviceFee, 0);
  const refundTotal = refunds.reduce((sum, refund) => sum + Number(refund.amount ?? 0), 0);
  const dineInSales = filteredTransactions.filter((transaction) => transaction.orderType === 'Dine-In').reduce((sum, transaction) => sum + transaction.totalPaid, 0);
  const takeoutSales = filteredTransactions.filter((transaction) => transaction.orderType === 'Takeout').reduce((sum, transaction) => sum + transaction.totalPaid, 0);

  const chartData = [
    { label: 'Dine-In Sales', amount: dineInSales },
    { label: 'Takeout Sales', amount: takeoutSales },
    { label: 'Tax', amount: totalTax },
    { label: 'Service Fees', amount: totalServiceFees },
    { label: 'Discounts', amount: totalDiscounts },
    { label: 'Refunds', amount: refundTotal },
  ];

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="reports" onNavigate={onNavigate} onLogout={onLogout} />
      <div className="flex-1 overflow-auto bg-background p-8">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-primary mb-2">Reports</h1>
            <p className="text-muted-foreground">All report values come from orders, payments, receipts, discounts, and refunds.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg"><Download className="w-4 h-4" />Export PDF</button>
            <button onClick={() => window.print()} className="flex items-center gap-2 border border-border px-5 py-3 rounded-lg"><Printer className="w-4 h-4" />Print Report</button>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
          <h2 className="text-primary mb-4">Sales Overview Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Order ID or Receipt ID" className="px-4 py-3 border border-border rounded-lg bg-input-background" />
            <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="px-4 py-3 border border-border rounded-lg bg-input-background" />
            <select value={orderType} onChange={(event) => setOrderType(event.target.value)} className="px-4 py-3 border border-border rounded-lg bg-input-background">
              <option value="all">All Order Types</option>
              <option value="Dine-In">Dine-In</option>
              <option value="Takeout">Takeout</option>
            </select>
            <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className="px-4 py-3 border border-border rounded-lg bg-input-background">
              <option value="all">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Refunded">Refunded</option>
            </select>
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="px-4 py-3 border border-border rounded-lg bg-input-background">
              <option value="all">All Payment Methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="E-Wallet">E-Wallet</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            ['Total Revenue', peso(totalRevenue)],
            ['Total Paid Orders', String(filteredTransactions.filter((transaction) => transaction.status === 'Paid').length)],
            ['Total Discounts', peso(totalDiscounts)],
            ['Total Tax Collected', peso(totalTax)],
            ['Total Service Fees', peso(totalServiceFees)],
            ['Refund Summary', peso(refundTotal)],
            ['Dine-In Sales', peso(dineInSales)],
            ['Takeout Sales', peso(takeoutSales)],
          ].map(([label, value]) => (
            <div key={label} className="bg-card rounded-xl shadow-sm border border-border p-5">
              <p className="text-sm text-muted-foreground mb-1">{label}</p>
              <h2 className="text-2xl text-primary">{value}</h2>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
          <h2 className="text-primary mb-4">Sales Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: number) => peso(value)} />
              <Legend />
              <Bar dataKey="amount" fill="#1F3E9A" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-primary mb-4">Detailed Transaction Records</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  {['Date', 'Order ID', 'Receipt ID', 'Customer Name', 'Order Type', 'Subtotal', 'Service Fee', 'Tax', 'Discount', 'Total Paid', 'Payment Method', 'Status'].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-sm">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={`${transaction.orderId}-${transaction.receiptId}`} className="border-t border-border hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">{transaction.date}</td>
                    <td className="px-4 py-3 text-sm">{transaction.orderId}</td>
                    <td className="px-4 py-3 text-sm">{transaction.receiptId}</td>
                    <td className="px-4 py-3 text-sm">{transaction.customerName}</td>
                    <td className="px-4 py-3 text-sm">{transaction.orderType}</td>
                    <td className="px-4 py-3 text-sm">{peso(transaction.subtotal)}</td>
                    <td className="px-4 py-3 text-sm">{peso(transaction.serviceFee)}</td>
                    <td className="px-4 py-3 text-sm">{peso(transaction.tax)}</td>
                    <td className="px-4 py-3 text-sm">{peso(transaction.discount)}</td>
                    <td className="px-4 py-3 text-sm">{peso(transaction.totalPaid)}</td>
                    <td className="px-4 py-3 text-sm">{transaction.paymentMethod}</td>
                    <td className="px-4 py-3 text-sm">{transaction.status}</td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr><td colSpan={12} className="px-4 py-8 text-center text-sm text-muted-foreground">No paid transactions found for the selected filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
