import { useState } from 'react';
import { Sidebar } from './Sidebar';
import type { Page, POSOrder } from '../App';
import { CreditCard, Wallet, Banknote } from 'lucide-react';

interface PaymentProps {
  onNavigate: (page: Page) => void;
  currentOrder: POSOrder | null;
}

export function Payment({ onNavigate, currentOrder }: PaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'ewallet'>('cash');
  const [paymentTiming, setPaymentTiming] = useState<'now' | 'later'>('now');

  const handleProcessPayment = () => {
    onNavigate('receipt');
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="create-order" onNavigate={onNavigate} onLogout={() => onNavigate('login')} />

      <div className="flex-1 overflow-auto bg-background">
        <div className="p-8">
          <h1 className="text-primary mb-6">Payment</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
                <h2 className="text-primary mb-4">Order Summary</h2>
                {currentOrder ? (
                  <div className="space-y-2">
                    <p><strong>Customer:</strong> {currentOrder.customerName}</p>
                    <p><strong>Order Type:</strong> {currentOrder.orderType}</p>
                    <div className="border-t border-border pt-4 mt-4">
                      <p className="mb-2"><strong>Items:</strong></p>
                      {currentOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between mb-2">
                          <span>{item.quantity}x {item.name}</span>
                          <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border pt-4 mt-4">
                      <div className="flex justify-between text-xl">
                        <strong>Total Amount:</strong>
                        <strong className="text-primary">₱{currentOrder.subtotal?.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No order data available</p>
                )}
              </div>
            </div>

            <div>
              <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
                <h2 className="text-primary mb-4">Payment Timing</h2>
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setPaymentTiming('now')}
                    className={`flex-1 py-3 rounded-lg transition-colors ${
                      paymentTiming === 'now'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Pay Now
                  </button>
                  <button
                    onClick={() => setPaymentTiming('later')}
                    className={`flex-1 py-3 rounded-lg transition-colors ${
                      paymentTiming === 'later'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Pay Later
                  </button>
                </div>

                {paymentTiming === 'now' && (
                  <>
                    <h2 className="text-primary mb-4">Payment Method</h2>
                    <div className="space-y-3 mb-6">
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                          paymentMethod === 'cash'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Banknote className="w-6 h-6 text-primary" />
                        <span>Cash</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                          paymentMethod === 'card'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <CreditCard className="w-6 h-6 text-primary" />
                        <span>Card</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('ewallet')}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                          paymentMethod === 'ewallet'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Wallet className="w-6 h-6 text-primary" />
                        <span>E-Wallet</span>
                      </button>
                    </div>
                  </>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => onNavigate('create-order')}
                    className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {paymentTiming === 'now' ? 'Process Payment' : 'Confirm Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
