import { useState } from 'react';
import { X } from 'lucide-react';
import type { Page } from '../App';
import { db } from '../lib/database';
import { Sidebar } from './Sidebar';

interface OrderListProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

type OrderView = {
  id: string;
  customer: string;
  type: string;
  table: string;
  subtotal: number;
  serviceFee: number;
  tax: number;
  discount: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  date: string;
  time: string;
  items: { name: string; quantity: number; price: number; orderType?: string }[];
};

const peso = (amount: number) => `₱${amount.toFixed(2)}`;

export function OrderList({ onNavigate, onLogout }: OrderListProps) {
  const [, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [viewOrder, setViewOrder] = useState<OrderView | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<OrderView | null>(null);
  const [refundOrder, setRefundOrder] = useState<OrderView | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<OrderView | null>(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [paymentResult, setPaymentResult] = useState<{ paymentId: string; receiptId: string; change: number; received: number } | null>(null);

  const orders: OrderView[] = db.all('orders').map((order) => {
      const createdAt = new Date(String(order.created_at ?? new Date().toISOString()));
      return {
        id: String(order.id),
        customer: String(order.customer_name),
        type: order.dining_option === 'dine-in' ? 'Dine-In' : 'Takeout',
        table: order.table_number ? String(order.table_number) : '-',
        subtotal: Number(order.subtotal ?? 0),
        serviceFee: Number(order.service_fee ?? 0),
        tax: Number(order.tax ?? 0),
        discount: Number(order.discount ?? 0),
        total: Number(order.total ?? 0),
        paymentStatus: String(order.payment_status ?? 'Pending'),
        orderStatus: String(order.order_status ?? 'Serving'),
        date: createdAt.toISOString().slice(0, 10),
        time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: db.all('order_items').filter((item) => item.order_id === order.id).map((item) => ({
          name: String(item.name),
          quantity: Number(item.quantity),
          price: Number(item.price),
          orderType: String(item.order_type ?? ''),
        })),
      };
    });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.includes(searchTerm) || order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || order.type === typeFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
    const matchesDate = !dateFilter || order.date === dateFilter;
    return matchesSearch && matchesType && matchesPayment && matchesStatus && matchesDate;
  });

  const confirmPayment = () => {
    if (!paymentOrder) return;
    const received = Number(amountReceived) || 0;
    if (received < paymentOrder.total) return;
    const change = received - paymentOrder.total;
    const paymentId = db.nextId('PAY', 'payments');
    const receiptId = db.nextId('REC', 'receipts');

    db.update('orders', paymentOrder.id, { payment_status: 'Paid', order_status: 'Completed' });
    db.insert('payments', {
      id: paymentId,
      order_id: paymentOrder.id,
      amount_due: paymentOrder.total,
      amount_received: received,
      change,
      method: 'Cash',
      status: 'Paid',
      paid_at: new Date().toISOString(),
    });
    db.insert('receipts', {
      id: receiptId,
      receipt_number: receiptId,
      payment_id: paymentId,
      order_id: paymentOrder.id,
      total: paymentOrder.total,
      amount_received: received,
      change,
      printed_at: new Date().toISOString(),
    });
    if (paymentOrder.type === 'Dine-In' && paymentOrder.table !== '-') {
      const table = db.all('tables').find((record) => String(record.number) === paymentOrder.table);
      if (table) db.update('tables', table.id, { status: 'available', current_order_id: null });
    }
    setPaymentResult({ paymentId, receiptId, change, received });
    setPaymentOrder(null);
    setRefreshKey((key) => key + 1);
  };

  const confirmRefund = () => {
    if (!refundOrder || refundOrder.paymentStatus !== 'Paid' || !refundReason.trim()) return;
    db.insert('refunds', {
      id: db.nextId('REF', 'refunds'),
      order_id: refundOrder.id,
      receipt_id: db.all('receipts').find((receipt) => receipt.order_id === refundOrder.id)?.id ?? '',
      reason: refundReason,
      amount: refundOrder.total,
      created_at: new Date().toISOString(),
    });
    db.update('orders', refundOrder.id, { order_status: 'Refunded' });
    db.all('payments')
      .filter((payment) => payment.order_id === refundOrder.id)
      .forEach((payment) => db.update('payments', payment.id, { status: 'Refunded' }));
    setRefundOrder(null);
    setRefundReason('');
    setRefreshKey((key) => key + 1);
  };

  const activeReceipt = receiptOrder ?? (paymentResult ? orders.find((order) => order.id === db.all('receipts').find((receipt) => receipt.id === paymentResult.receiptId)?.order_id) ?? null : null);
  const activeReceiptRecord = activeReceipt ? db.all('receipts').find((receipt) => receipt.order_id === activeReceipt.id) : null;
  const activePaymentRecord = activeReceipt ? db.all('payments').find((payment) => payment.order_id === activeReceipt.id) : null;

  const deleteOrderAndRelated = (orderId: string) => {
    // remove order items and customizations
    db.all('order_items').filter((it) => it.order_id === orderId).forEach((it) => {
      db.all('order_item_customizations').filter((c) => c.order_item_id === it.id).forEach((c) => db.delete('order_item_customizations', c.id));
      db.delete('order_items', it.id);
    });
    // remove payments and receipts
    db.all('payments').filter((p) => p.order_id === orderId).forEach((p) => db.delete('payments', p.id));
    db.all('receipts').filter((r) => r.order_id === orderId).forEach((r) => db.delete('receipts', r.id));
    // remove discounts for order
    db.all('discounts').filter((d) => d.order_id === orderId).forEach((d) => db.delete('discounts', d.id));
    // free table if occupied
    const table = db.all('tables').find((t) => t.current_order_id === orderId);
    if (table) db.update('tables', table.id, { status: 'available', current_order_id: null });
    // finally delete order
    db.delete('orders', orderId);
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="order-list" onNavigate={onNavigate} onLogout={onLogout} />
      <div className="flex-1 overflow-auto bg-background p-8">
        <h1 className="text-primary mb-6">Order List</h1>
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search Order ID or Customer Name" className="px-4 py-3 border border-border rounded-lg bg-input-background" />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="px-4 py-3 border border-border rounded-lg bg-input-background">
              <option value="all">All Order Types</option>
              <option value="Dine-In">Dine-In</option>
              <option value="Takeout">Takeout</option>
            </select>
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="px-4 py-3 border border-border rounded-lg bg-input-background">
              <option value="all">All Payment Statuses</option>
              <option value="Pending">Pending Payment</option>
              <option value="Paid">Paid</option>
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-4 py-3 border border-border rounded-lg bg-input-background">
              <option value="all">All Order Statuses</option>
              <option value="Serving">Serving</option>
              <option value="Completed">Completed</option>
              <option value="Refunded">Refunded</option>
            </select>
            <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="px-4 py-3 border border-border rounded-lg bg-input-background" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  {['Order ID', 'Customer Name', 'Order Type', 'Table', 'Total', 'Payment Status', 'Order Status', 'Date', 'Actions'].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-sm">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-border hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">{order.id}</td>
                    <td className="px-4 py-3 text-sm">{order.customer}</td>
                    <td className="px-4 py-3 text-sm">{order.type}</td>
                    <td className="px-4 py-3 text-sm">{order.table}</td>
                    <td className="px-4 py-3 text-sm">{peso(order.total)}</td>
                    <td className="px-4 py-3 text-sm">{order.paymentStatus}</td>
                    <td className="px-4 py-3 text-sm">{order.orderStatus}</td>
                    <td className="px-4 py-3 text-sm">{order.date} {order.time}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setViewOrder(order)} className="px-3 py-1 bg-muted rounded-lg text-xs">View Details</button>
                        {order.paymentStatus === 'Paid' ? (
                          <>
                            <button onClick={() => setReceiptOrder(order)} className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs">Receipt</button>
                            <button onClick={() => setRefundOrder(order)} className="px-3 py-1 bg-destructive text-destructive-foreground rounded-lg text-xs">Refund</button>
                          </>
                        ) : (
                          <button onClick={() => setPaymentOrder(order)} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg text-xs">Process Payment</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">No database orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-5">
            <div className="flex justify-between mb-4"><h2 className="text-lg text-primary">Order Details</h2><button onClick={() => setViewOrder(null)}><X /></button></div>
            <div className="space-y-2 text-sm">
              <p><strong>Order ID:</strong> {viewOrder.id}</p>
              <p><strong>Customer:</strong> {viewOrder.customer}</p>
              <p><strong>Order Type:</strong> {viewOrder.type}</p>
              <p><strong>Table:</strong> {viewOrder.table}</p>
              {viewOrder.items.map((item) => <div key={item.name} className="flex justify-between border-b border-border py-2"><span>{item.quantity}x {item.name}</span><span>{peso(item.price * item.quantity)}</span></div>)}
              <div className="pt-3 space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{peso(viewOrder.subtotal)}</span></div>
                <div className="flex justify-between"><span>Service Fee 1%</span><span>{peso(viewOrder.serviceFee)}</span></div>
                <div className="flex justify-between"><span>Tax 12%</span><span>{peso(viewOrder.tax)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>- {peso(viewOrder.discount)}</span></div>
                <div className="flex justify-between text-primary font-medium border-t border-border pt-2"><span>Total Amount</span><span>{peso(viewOrder.total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-5">
            <div className="flex justify-between mb-4"><h2 className="text-lg text-primary">Payment Summary</h2><button onClick={() => setPaymentOrder(null)}><X /></button></div>
            <div className="space-y-2 text-sm">
              <p><strong>Order ID:</strong> {paymentOrder.id}</p>
              <p><strong>Customer:</strong> {paymentOrder.customer}</p>
              <p><strong>Order Type:</strong> {paymentOrder.type}</p>
              {paymentOrder.table !== '-' && <p><strong>Table:</strong> {paymentOrder.table}</p>}
              {paymentOrder.items.map((item) => <div key={item.name} className="flex justify-between border-b border-border py-2"><span>{item.quantity}x {item.name}</span><span>{peso(item.price * item.quantity)}</span></div>)}
              <div className="bg-muted rounded-lg p-4 space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{peso(paymentOrder.subtotal)}</span></div>
                <div className="flex justify-between"><span>Service Fee 1%</span><span>{peso(paymentOrder.serviceFee)}</span></div>
                <div className="flex justify-between"><span>Tax 12%</span><span>{peso(paymentOrder.tax)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>- {peso(paymentOrder.discount)}</span></div>
                <div className="flex justify-between text-primary font-medium"><span>Total Amount Due</span><span>{peso(paymentOrder.total)}</span></div>
              </div>
              <input value={amountReceived} onChange={(event) => setAmountReceived(event.target.value)} type="number" placeholder="Amount Received" className="w-full px-4 py-3 border border-border rounded-lg" />
              <p className="text-secondary">Change: {peso(Math.max((Number(amountReceived) || 0) - paymentOrder.total, 0))}</p>
              <div className="flex gap-3">
                <button onClick={() => setPaymentOrder(null)} className="flex-1 px-4 py-3 border border-border rounded-lg">Cancel</button>
                <button onClick={confirmPayment} disabled={(Number(amountReceived) || 0) < paymentOrder.total} className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg disabled:opacity-50">Confirm Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 text-center">
            <h2 className="text-xl text-primary mb-4">Payment Successful</h2>
            <div className="bg-muted rounded-lg p-4 text-left text-sm space-y-2 mb-4">
              <div className="flex justify-between"><span>Payment ID</span><strong>{paymentResult.paymentId}</strong></div>
              <div className="flex justify-between"><span>Receipt ID</span><strong>{paymentResult.receiptId}</strong></div>
              <div className="flex justify-between"><span>Order ID</span><strong>{activeReceipt?.id}</strong></div>
              <div className="flex justify-between"><span>Total Amount Due</span><strong>{activeReceipt ? peso(activeReceipt.total) : peso(0)}</strong></div>
              <div className="flex justify-between"><span>Amount Received</span><strong>{peso(paymentResult.received)}</strong></div>
              <div className="flex justify-between text-secondary"><span>Change</span><strong>{peso(paymentResult.change)}</strong></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setReceiptOrder(activeReceipt)} className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg">Print Receipt</button>
              <button onClick={() => setPaymentResult(null)} className="flex-1 px-4 py-3 border border-border rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {activeReceipt && receiptOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between p-4 border-b border-border"><h2 className="text-primary">Receipt</h2><button onClick={() => setReceiptOrder(null)}><X /></button></div>
            <div className="p-5 bg-gray-100">
              <div className="thermal-receipt mx-auto bg-white p-5 font-mono text-black shadow-lg text-xs">
                <div className="text-center mb-3"><strong>FINE DINE RESTAURANT</strong><p>123 Main Street, Cebu City</p><p>OFFICIAL RECEIPT</p></div>
                <div className="border-t border-dashed py-2 space-y-1">
                  <div className="flex justify-between"><span>Receipt ID</span><span>{String(activeReceiptRecord?.id ?? '')}</span></div>
                  <div className="flex justify-between"><span>Order ID</span><span>{activeReceipt.id}</span></div>
                  <div className="flex justify-between"><span>Payment ID</span><span>{String(activePaymentRecord?.id ?? '')}</span></div>
                  <div className="flex justify-between"><span>Cashier</span><span>Staff Cashier</span></div>
                  <div className="flex justify-between"><span>Customer</span><span>{activeReceipt.customer}</span></div>
                  <div className="flex justify-between"><span>Type</span><span>{activeReceipt.type}</span></div>
                  {activeReceipt.table !== '-' && <div className="flex justify-between"><span>Table</span><span>{activeReceipt.table}</span></div>}
                </div>
                <div className="border-t border-dashed py-2">
                  {(() => {
                    const dineInItems = activeReceipt.items.filter((it) => it.orderType === 'dine-in');
                    const takeoutItems = activeReceipt.items.filter((it) => it.orderType === 'takeout');
                    if (dineInItems.length > 0 && takeoutItems.length > 0) {
                      const dineSubtotal = dineInItems.reduce((s, it) => s + it.price * it.quantity, 0);
                      const takeSubtotal = takeoutItems.reduce((s, it) => s + it.price * it.quantity, 0);
                      return (
                        <div className="space-y-2">
                          <div>
                            <div className="text-sm font-medium">Dine-In</div>
                            {dineInItems.map((item) => <div key={`d-${item.name}`} className="flex justify-between text-xs"><span>{item.quantity}x {item.name}</span><span>{peso(item.price * item.quantity)}</span></div>)}
                            <div className="flex justify-between text-xs font-medium border-t pt-1"><span>Dine-In Subtotal</span><span>{peso(dineSubtotal)}</span></div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Takeout</div>
                            {takeoutItems.map((item) => <div key={`t-${item.name}`} className="flex justify-between text-xs"><span>{item.quantity}x {item.name}</span><span>{peso(item.price * item.quantity)}</span></div>)}
                            <div className="flex justify-between text-xs font-medium border-t pt-1"><span>Takeout Subtotal</span><span>{peso(takeSubtotal)}</span></div>
                          </div>
                        </div>
                      );
                    }
                    return activeReceipt.items.map((item) => <div key={item.name} className="flex justify-between"><span>{item.quantity}x {item.name}</span><span>{peso(item.price * item.quantity)}</span></div>);
                  })()}
                </div>
                <div className="border-t border-dashed py-2 space-y-1">
                  <div className="flex justify-between"><span>Subtotal</span><span>{peso(activeReceipt.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Service Fee</span><span>{peso(activeReceipt.serviceFee)}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>{peso(activeReceipt.tax)}</span></div>
                  <div className="flex justify-between"><span>Discount</span><span>- {peso(activeReceipt.discount)}</span></div>
                  <div className="flex justify-between font-bold"><span>TOTAL</span><span>{peso(activeReceipt.total)}</span></div>
                  <div className="flex justify-between"><span>Received</span><span>{peso(Number(activeReceiptRecord?.amount_received ?? activePaymentRecord?.amount_received ?? 0))}</span></div>
                  <div className="flex justify-between"><span>Change</span><span>{peso(Number(activeReceiptRecord?.change ?? activePaymentRecord?.change ?? 0))}</span></div>
                </div>
                <p className="text-center border-t border-dashed pt-2">THANK YOU. PLEASE COME AGAIN.</p>
              </div>
            </div>
            <div className="p-4 flex gap-3">
              <button onClick={() => window.print()} className="flex-1 bg-primary text-primary-foreground rounded-lg py-3">Print Receipt</button>
              <button onClick={() => {
                // remove this order from the database so it no longer appears in the order list
                if (activeReceipt) {
                  deleteOrderAndRelated(activeReceipt.id);
                  setRefreshKey((k) => k + 1);
                }
                setReceiptOrder(null);
              }} className="flex-1 border border-border rounded-lg py-3">Back to Order List</button>
            </div>
          </div>
        </div>
      )}

      {refundOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-5">
            <div className="flex justify-between mb-4"><h2 className="text-lg text-destructive">Refund</h2><button onClick={() => setRefundOrder(null)}><X /></button></div>
            <div className="space-y-3 text-sm">
              <p><strong>Order ID:</strong> {refundOrder.id}</p>
              <p><strong>Receipt ID:</strong> {String(db.all('receipts').find((receipt) => receipt.order_id === refundOrder.id)?.id ?? 'No receipt')}</p>
              <p><strong>Customer:</strong> {refundOrder.customer}</p>
              <p><strong>Total Paid:</strong> {peso(refundOrder.total)}</p>
              <textarea value={refundReason} onChange={(event) => setRefundReason(event.target.value)} placeholder="Refund Reason" className="w-full px-4 py-3 border border-border rounded-lg" />
              <p><strong>Refund Amount:</strong> {peso(refundOrder.total)}</p>
              <button onClick={confirmRefund} disabled={!refundReason.trim() || refundOrder.paymentStatus !== 'Paid'} className="w-full px-4 py-3 bg-destructive text-destructive-foreground rounded-lg disabled:opacity-50">Confirm Refund</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
