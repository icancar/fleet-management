import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { User, UserRole } from '@shared/types';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';

interface DriverFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  managerId: string;
}

interface ManagerFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export const Drivers: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const [drivers, setDrivers] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<User | null>(null);
  const [editingManager, setEditingManager] = useState<User | null>(null);
  const [managersCollapsed, setManagersCollapsed] = useState(false);
  const [driversCollapsed, setDriversCollapsed] = useState(false);
  const [managersSearchTerm, setManagersSearchTerm] = useState('');
  const [driversSearchTerm, setDriversSearchTerm] = useState('');
  const [formData, setFormData] = useState<DriverFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    managerId: ''
  });
  const [managerFormData, setManagerFormData] = useState<ManagerFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  const canManageDrivers = user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;

  // Filter managers based on search term
  const filteredManagers = useMemo(() => {
    if (!managersSearchTerm.trim()) return managers;
    
    const searchLower = managersSearchTerm.toLowerCase();
    return managers.filter(manager => 
      manager.firstName.toLowerCase().includes(searchLower) ||
      manager.lastName.toLowerCase().includes(searchLower) ||
      `${manager.firstName} ${manager.lastName}`.toLowerCase().includes(searchLower)
    );
  }, [managers, managersSearchTerm]);

  // Filter drivers based on search term
  const filteredDrivers = useMemo(() => {
    if (!driversSearchTerm.trim()) return drivers;
    
    const searchLower = driversSearchTerm.toLowerCase();
    return drivers.filter(driver => 
      driver.firstName.toLowerCase().includes(searchLower) ||
      driver.lastName.toLowerCase().includes(searchLower) ||
      `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchLower)
    );
  }, [drivers, driversSearchTerm]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (isAdmin) {
        // Admin fetches both managers and drivers
        const response = await fetch('/api/drivers/employees', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setManagers(data.data.managers || []);
          setDrivers(data.data.drivers || []);
        }
      } else {
        // Manager fetches drivers and also needs managers for driver creation
        const [driversResponse, managersResponse] = await Promise.all([
          fetch('/api/drivers', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/drivers/employees', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (driversResponse.ok) {
          const driversData = await driversResponse.json();
          setDrivers(driversData.data || []);
        }

        if (managersResponse.ok) {
          const managersData = await managersResponse.json();
          setManagers(managersData.data.managers || []);
        }
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (formData.firstName.length < 2) {
      showError('Validation Error', 'First name must be at least 2 characters long.');
      return;
    }
    if (formData.lastName.length < 2) {
      showError('Validation Error', 'Last name must be at least 2 characters long.');
      return;
    }
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone)) {
      showError('Validation Error', 'Please enter a valid phone number (numbers only, optional + at start).');
      return;
    }
    if (!editingDriver && !formData.managerId) {
      showError('Validation Error', 'Please select a manager for the driver.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const url = editingDriver ? `/api/drivers/${editingDriver._id}` : '/api/drivers';
      const method = editingDriver ? 'PUT' : 'POST';
      
      const payload = editingDriver 
        ? { firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchDrivers();
        setShowModal(false);
        setEditingDriver(null);
        setFormData({ email: '', password: '', firstName: '', lastName: '', phone: '', managerId: '' });
        showSuccess('Success!', editingDriver ? 'Driver updated successfully!' : 'Driver created successfully!');
      } else {
        const errorData = await response.json();
        console.error('Error saving driver:', response.status, response.statusText, errorData);
        
        // Show detailed validation errors
        if (errorData.message && errorData.message.includes('Validation failed')) {
          showError('Validation Error', errorData.message);
        } else {
          showError('Error', errorData.message || 'Failed to save driver');
        }
      }
    } catch (error) {
      console.error('Error saving driver:', error);
      showError('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleEdit = (driver: User) => {
    setEditingDriver(driver);
    setFormData({
      email: driver.email,
      password: '',
      firstName: driver.firstName,
      lastName: driver.lastName,
      phone: driver.phone || '',
      managerId: driver.managerId || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (driverId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this driver?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchDrivers();
        showSuccess('Success!', 'Driver deactivated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Error deleting driver:', response.status, response.statusText, errorData);
        showError('Error', errorData.message || 'Failed to deactivate driver');
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
      showError('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Manager management functions
  const handleManagerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (managerFormData.firstName.length < 2) {
      showError('Validation Error', 'First name must be at least 2 characters long.');
      return;
    }
    if (managerFormData.lastName.length < 2) {
      showError('Validation Error', 'Last name must be at least 2 characters long.');
      return;
    }
    if (managerFormData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(managerFormData.phone)) {
      showError('Validation Error', 'Please enter a valid phone number (numbers only, optional + at start).');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const url = editingManager ? `/api/drivers/managers/${editingManager._id}` : '/api/drivers/managers';
      const method = editingManager ? 'PUT' : 'POST';
      
      const payload = {
        ...managerFormData,
        password: editingManager ? undefined : managerFormData.password
      };
      

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchDrivers();
        setShowManagerModal(false);
        setEditingManager(null);
        setManagerFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phone: ''
        });
        showSuccess('Success!', editingManager ? 'Manager updated successfully!' : 'Manager created successfully!');
      } else {
        const errorData = await response.json();
        console.error('Error saving manager:', response.status, response.statusText, errorData);
        
        // Show detailed validation errors
        if (errorData.message && errorData.message.includes('Validation failed')) {
          showError('Validation Error', errorData.message);
        } else {
          showError('Error', errorData.message || 'Failed to save manager');
        }
      }
    } catch (error) {
      console.error('Error saving manager:', error);
      showError('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleManagerEdit = (manager: User) => {
    setEditingManager(manager);
    setManagerFormData({
      email: manager.email,
      password: '',
      firstName: manager.firstName,
      lastName: manager.lastName,
      phone: manager.phone || ''
    });
    setShowManagerModal(true);
  };

  const handleManagerDelete = async (managerId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this manager?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/drivers/managers/${managerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchDrivers();
        showSuccess('Success!', 'Manager deactivated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Error deleting manager:', response.status, response.statusText, errorData);
        showError('Error', errorData.message || 'Failed to deactivate manager');
      }
    } catch (error) {
      console.error('Error deleting manager:', error);
      showError('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const openManagerCreateModal = () => {
    setEditingManager(null);
    setManagerFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: ''
    });
    setShowManagerModal(true);
  };

  const openCreateModal = () => {
    setEditingDriver(null);
    setFormData({ email: '', password: '', firstName: '', lastName: '', phone: '', managerId: '' });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
      <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Employees' : 'Drivers'}
          </h1>
        <p className="mt-1 text-sm text-gray-500">
            {isAdmin 
              ? 'Manage all employees - managers and drivers.' 
              : 'Manage driver profiles and assignments.'
            }
        </p>
        </div>
      </div>

      {/* Managers Table - Only for Admin */}
      {isAdmin && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button
                  onClick={() => setManagersCollapsed(!managersCollapsed)}
                  className="mr-3 p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {managersCollapsed ? (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Managers</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {filteredManagers.length} of {managers.length} manager{managers.length !== 1 ? 's' : ''} in your company
                  </p>
                </div>
              </div>
              <button
                onClick={openManagerCreateModal}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Manager
              </button>
            </div>
          </div>
          {!managersCollapsed && (
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search managers by name..."
                  value={managersSearchTerm}
                  onChange={(e) => setManagersSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {managersSearchTerm && (
                  <button
                    onClick={() => setManagersSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          )}
          {!managersCollapsed && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredManagers.map((manager) => (
                  <tr key={manager._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-800">
                              {manager.firstName.charAt(0)}{manager.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {manager.firstName} {manager.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Manager
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {manager.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {manager.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        manager.isActive 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {manager.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleManagerEdit(manager)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleManagerDelete(manager._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredManagers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      {managersSearchTerm ? 'No managers found matching your search' : 'No managers found'}
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Drivers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => setDriversCollapsed(!driversCollapsed)}
                className="mr-3 p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                {driversCollapsed ? (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Drivers</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {filteredDrivers.length} of {drivers.length} driver{drivers.length !== 1 ? 's' : ''} in your company
                </p>
              </div>
            </div>
            {canManageDrivers && (
              <button
                onClick={openCreateModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Driver
              </button>
            )}
          </div>
        </div>
        {!driversCollapsed && (
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search drivers by name..."
                value={driversSearchTerm}
                onChange={(e) => setDriversSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {driversSearchTerm && (
                <button
                  onClick={() => setDriversSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        )}
        {!driversCollapsed && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {canManageDrivers && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrivers.map((driver) => (
                <tr key={driver._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {driver.firstName} {driver.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {typeof driver.managerId === 'object' && driver.managerId
                        ? `${driver.managerId.firstName} ${driver.managerId.lastName}`
                        : 'Unassigned'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      driver.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {driver.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canManageDrivers && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(driver)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(driver._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deactivate
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan={canManageDrivers ? 6 : 5} className="px-6 py-4 text-center text-sm text-gray-500">
                    {driversSearchTerm ? 'No drivers found matching your search' : 'No drivers found'}
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={!!editingDriver}
                  />
                </div>
                {!editingDriver && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {!editingDriver && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Manager</label>
                    <select
                      value={formData.managerId}
                      onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a manager</option>
                      {managers.map((manager) => (
                        <option key={manager._id} value={manager._id}>
                          {manager.firstName} {manager.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    {editingDriver ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manager Modal */}
      {showManagerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingManager ? 'Edit Manager' : 'Add New Manager'}
              </h3>
              <form onSubmit={handleManagerSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={managerFormData.email}
                    onChange={(e) => setManagerFormData({ ...managerFormData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={!!editingManager}
                  />
                </div>
                {!editingManager && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={managerFormData.password}
                      onChange={(e) => setManagerFormData({ ...managerFormData, password: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={managerFormData.firstName}
                    onChange={(e) => setManagerFormData({ ...managerFormData, firstName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={managerFormData.lastName}
                    onChange={(e) => setManagerFormData({ ...managerFormData, lastName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={managerFormData.phone}
                    onChange={(e) => setManagerFormData({ ...managerFormData, phone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowManagerModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
                  >
                    {editingManager ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
