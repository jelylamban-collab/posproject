import { useMemo, useState } from 'react';
import type { Page, POSOrder } from '../App';
import { db, type DbRecord } from '../lib/database';
import { Sidebar } from './Sidebar';

interface TableManagementProps {
  onNavigate: (page: Page) => void;
  currentOrder: POSOrder | null;
}

interface WaitlistEntry {
  id: string;
  customer_name?: string;
  queue_number?: string;
  guests?: number;
  waiting_time?: string;
  status?: string;
  assigned_table?: number;
  order_id?: string;
}

export function TableManagement({ onNavigate }: TableManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tables, setTables] = useState<DbRecord[]>(() => db.all('tables'));
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => db.all('table_waitlist') as WaitlistEntry[]);
  const [viewingGuest, setViewingGuest] = useState<WaitlistEntry | null>(null);

  const availableTables = tables.filter((table) => table.status === 'available');
  const queueIsOpen = availableTables.length === 0;

  const filteredTables = useMemo(
    () =>
      tables.filter((table) => {
        const number = String(table.number ?? '');
        const status = String(table.status ?? '');
        const matchesSearch = number.includes(searchTerm.trim());
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [searchTerm, statusFilter, tables],
  );

  const refreshRecords = () => {
    setTables(db.all('tables'));
    setWaitlist(db.all('table_waitlist'));
  };

  const changeTableStatus = (table: DbRecord, status: string) => {
    db.update('tables', table.id, {
      status,
      current_order_id: status === 'available' ? null : table.current_order_id ?? null,
    });
    refreshRecords();
  };

  const assignNextQueue = (table: DbRecord) => {
    const nextGuest = waitlist.find((guest) => guest.status === 'Waiting');
    if (!nextGuest || table.status !== 'available') return;
    db.update('tables', table.id, {
      status: 'occupied',
      current_waitlist_id: nextGuest.id,
      queue_customer_name: nextGuest.customer_name,
    });
    db.update('table_waitlist', String(nextGuest.id), {
      status: 'Assigned',
      assigned_table: table.number,
      assigned_at: new Date().toISOString(),
    });
    refreshRecords();
  };

  const removeWaitlistEntry = (guest: WaitlistEntry) => {
    // permanently remove the waitlist entry so it no longer appears
    db.delete('table_waitlist', guest.id);
    refreshRecords();
  };

  const viewWaitlistEntry = (guest: WaitlistEntry) => {
    setViewingGuest(guest);
  };

  const statusColor = (status: unknown) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-red-500';
      case 'reserved':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="table-management" onNavigate={onNavigate} onLogout={() => onNavigate('login')} />

      <div className="flex-1 overflow-auto bg-background p-8">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-primary mb-2">Table Records</h1>
            <p className="text-muted-foreground">Connected to the tables database table. Dine-in payment releases occupied tables.</p>
          </div>
          <button onClick={refreshRecords} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
            Refresh Records
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search table number"
              className="px-4 py-3 border border-border rounded-lg bg-input-background"
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-4 py-3 border border-border rounded-lg bg-input-background">
              <option value="all">All Table Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              Records: {filteredTables.length}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
            {filteredTables.map((table) => (
              <div key={table.id} className="border border-border rounded-lg p-4">
                <div className={`aspect-square ${statusColor(table.status)} text-white rounded-lg grid place-items-center text-2xl mb-3`}>
                  {String(table.number)}
                </div>
                <p className="text-sm font-medium capitalize">{String(table.status)}</p>
                <p className="text-xs text-muted-foreground mb-3">{String(table.id)}</p>
                {Boolean(table.queue_customer_name) && (
                  <p className="text-xs text-muted-foreground mb-3">Queued: {String(table.queue_customer_name)}</p>
                )}
                <select
                  value={String(table.status)}
                  onChange={(event) => changeTableStatus(table, event.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs mb-2 bg-input-background"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                {table.status === 'available' && waitlist.some((guest) => guest.status === 'Waiting') && (
                  <button onClick={() => assignNextQueue(table)} className="w-full px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs">
                    Assign Next Queue
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-500" /> Available</div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-500" /> Occupied</div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-yellow-500" /> Reserved</div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-400" /> Maintenance</div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-primary">Table Queue</h2>
              <p className="text-xs text-muted-foreground">
                Queue is used only when all tables are not available.
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs ${queueIsOpen ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {queueIsOpen ? 'Open' : 'Standby'}
            </span>
          </div>

          {!queueIsOpen && (
            <div className="bg-muted rounded-lg p-3 mb-4 text-xs text-muted-foreground">
              Queue entry is disabled while there are available tables.
            </div>
          )}

          <div className="space-y-3">
              {waitlist.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No queued customers.</p>
            ) : (
              waitlist.map((guest) => (
                <div key={String(guest.id)} className="border border-border rounded-lg p-3">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{String(guest.customer_name)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(guest.queue_number ?? guest.id)} - {String(guest.guests)} guests
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Waiting Time: {String(guest.waiting_time ?? '0 min')}
                      </p>
                    </div>
                    <span className={`text-xs ${guest.status === 'Assigned' ? 'text-green-700' : 'text-primary'}`}>
                      {String(guest.status)}
                    </span>
                  </div>
                  {guest.assigned_table != null && (
                    <p className="text-xs text-muted-foreground mt-2">Assigned Table #{String(guest.assigned_table)}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => viewWaitlistEntry(guest)} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs">View</button>
                    <button onClick={() => removeWaitlistEntry(guest)} className="px-3 py-2 bg-destructive text-destructive-foreground rounded-lg text-xs">Remove</button>
                  </div>
                </div>
              ))
            )}
          </div>
          {viewingGuest && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-border">
                  <h2 className="text-lg text-primary">Queue Entry Info</h2>
                  <button onClick={() => setViewingGuest(null)} className="text-muted-foreground hover:text-foreground">Close</button>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  <div><strong>Name:</strong> {String(viewingGuest.customer_name)}</div>
                  <div><strong>Queue #:</strong> {String(viewingGuest.queue_number ?? viewingGuest.id)}</div>
                  <div><strong>Status:</strong> {String(viewingGuest.status)}</div>
                  <div><strong>Waiting Time:</strong> {String(viewingGuest.waiting_time ?? '0 min')}</div>
                  {viewingGuest.assigned_table != null && <div><strong>Assigned Table:</strong> #{String(viewingGuest.assigned_table)}</div>}
                  {viewingGuest.order_id != null && (
                    <div className="border-t pt-3">
                      <div className="text-sm font-medium mb-2">Linked Order</div>
                      {(() => {
                        const orderId = viewingGuest.order_id ? String(viewingGuest.order_id) : '';
                        const order = db.all('orders').find((o) => o.id === orderId);
                        if (!order) return <div className="text-xs text-muted-foreground">Order record not found.</div>;
                        return (
                          <div className="text-xs space-y-2">
                            <div><strong>Order ID:</strong> {String(order.id)}</div>
                            <div><strong>Customer:</strong> {String(order.customer_name)}</div>
                            <div><strong>Order Status:</strong> {String(order.order_status)}</div>
                            <div className="pt-2">
                              <div className="text-xs font-medium">Items:</div>
                              {db.all('order_items').filter((it) => it.order_id === order.id).map((it) => (
                                <div key={String(it.id)} className="flex justify-between">
                                  <span>{String(it.quantity)}x {String(it.name)}</span>
                                  <span>{String(it.price)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div className="p-4 border-t flex gap-3">
                  <button onClick={() => { if (viewingGuest) removeWaitlistEntry(viewingGuest as DbRecord); setViewingGuest(null); }} className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg">Remove</button>
                  <button onClick={() => setViewingGuest(null)} className="flex-1 px-4 py-2 border border-border rounded-lg">Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

// Viewing modal placed after component to avoid large inline insertions


