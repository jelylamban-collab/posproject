import { useState } from 'react';
import { Sidebar } from './Sidebar';
import type { Page, POSOrder } from '../App';
import { Printer } from 'lucide-react';

interface ReceiptProps {
  onNavigate: (page: Page) => void;
  currentOrder: POSOrder | null;
}

export function Receipt({ onNavigate, currentOrder }: ReceiptProps) {
  const [receiptNumber] = useState(
    () => 'REC-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
  );
  const [currentDate] = useState(() => new Date().toLocaleString());

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="create-order" onNavigate={onNavigate} onLogout={() => onNavigate('login')} />

      <div className="flex-1 overflow-auto bg-background">
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg shadow-lg border border-border p-8 mb-6">
              <div className="text-center border-b border-border pb-6 mb-6">
                <h1 className="text-primary mb-2">Restaurant POS System</h1>
                <p className="text-muted-foreground">Official Receipt</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt Number:</span>
                  <span>{receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time:</span>
                  <span>{currentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer Name:</span>
                  <span>{currentOrder?.customerName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Type:</span>
                  <span className="capitalize">{currentOrder?.orderType || 'N/A'}</span>
                </div>
              </div>

              <div className="border-t border-border pt-6 mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2">Item</th>
                      <th className="text-center py-2">Qty</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrder?.items?.map((item, idx) => (
                      <tr key={idx} className="border-b border-border">
                        <td className="py-3">{item.name}</td>
                        <td className="text-center py-3">{item.quantity}</td>
                        <td className="text-right py-3">₱{item.price.toFixed(2)}</td>
                        <td className="text-right py-3">₱{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t-2 border-primary pt-4">
                <div className="flex justify-between text-xl mb-2">
                  <strong>Total Amount:</strong>
                  <strong className="text-primary">₱{currentOrder?.subtotal?.toFixed(2) || '0.00'}</strong>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Payment Method:</span>
                  <span>Cash</span>
                </div>
              </div>

              <div className="text-center mt-8 pt-8 border-t border-border">
                <p className="text-muted-foreground">Thank you for your order!</p>
                <p className="text-sm text-muted-foreground mt-2">Please come again</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => onNavigate('pos-dashboard')}
                className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
