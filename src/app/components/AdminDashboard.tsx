import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { UserPlus, Edit, Trash2, Eye, X } from 'lucide-react';

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  status: 'Active' | 'Inactive';
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'Admin User', username: 'admin', role: 'Admin', status: 'Active' },
    { id: 2, name: 'John Doe', username: 'staff', role: 'Staff', status: 'Active' },
    { id: 3, name: 'Jane Smith', username: 'cashier', role: 'Cashier', status: 'Active' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | 'delete'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleAddUser = () => {
    setModalMode('add');
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleViewUser = (user: User) => {
    setModalMode('view');
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setModalMode('delete');
    setSelectedUser(user);
    setShowModal(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setShowModal(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="admin-dashboard" onNavigate={() => {}} onLogout={onLogout} isAdmin />

      <div className="flex-1 overflow-auto bg-background">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-primary mb-2">User Management</h1>
              <p className="text-muted-foreground">Manage system users and permissions</p>
            </div>
            <button
              onClick={handleAddUser}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Add User
            </button>
          </div>

          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left">User ID</th>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Username</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-border hover:bg-muted/50">
                    <td className="px-6 py-4">{user.id}</td>
                    <td className="px-6 py-4">{user.name}</td>
                    <td className="px-6 py-4">{user.username}</td>
                    <td className="px-6 py-4">{user.role}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm ${
                        user.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-secondary hover:bg-secondary/10 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-primary">
                {modalMode === 'add' && 'Add New User'}
                {modalMode === 'edit' && 'Edit User'}
                {modalMode === 'view' && 'View User'}
                {modalMode === 'delete' && 'Confirm Delete'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMode === 'delete' ? (
              <div>
                <p className="mb-6">Are you sure you want to delete user "{selectedUser?.name}"?</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Name</label>
                  <input
                    type="text"
                    defaultValue={selectedUser?.name}
                    disabled={modalMode === 'view'}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  />
                </div>
                <div>
                  <label className="block mb-2">Username</label>
                  <input
                    type="text"
                    defaultValue={selectedUser?.username}
                    disabled={modalMode === 'view'}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  />
                </div>
                <div>
                  <label className="block mb-2">Role</label>
                  <select
                    defaultValue={selectedUser?.role}
                    disabled={modalMode === 'view'}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  >
                    <option>Admin</option>
                    <option>Staff</option>
                    <option>Cashier</option>
                  </select>
                </div>
                {modalMode !== 'view' && (
                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      {modalMode === 'add' ? 'Add User' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
