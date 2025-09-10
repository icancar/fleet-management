import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { User, UserRole, Vehicle } from '@shared/types';
import { VEHICLE_BRANDS, getVehicleModels } from '@shared/data/vehicleData';

interface VehicleFormData {
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  nextServiceDate: string;
  odometer: number;
  driverId: string;
}

export const Vehicles: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>({
    licensePlate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    nextServiceDate: '',
    odometer: 0,
    driverId: ''
  });
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const canManageVehicles = user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;

  useEffect(() => {
    fetchVehicles();
    if (canManageVehicles) {
      fetchDrivers();
    }
  }, []);

  const handleMakeChange = (make: string) => {
    const models = getVehicleModels(make);
    setAvailableModels(models);
    setFormData({ ...formData, make, model: '' }); // Reset model when make changes
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVehicles(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vehicles/available-drivers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDrivers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingVehicle ? `/api/vehicles/${editingVehicle._id}` : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        driverId: formData.driverId || null,
        nextServiceDate: new Date(formData.nextServiceDate).toISOString()
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
        await fetchVehicles();
        setShowModal(false);
        setEditingVehicle(null);
        setFormData({
          licensePlate: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          vin: '',
          nextServiceDate: new Date().toISOString().split('T')[0],
          odometer: 0,
          driverId: ''
        });
      } else {
        const errorData = await response.json();
        console.error('Error saving vehicle:', response.status, response.statusText, errorData);
        showError('Error', errorData.message || 'Failed to save vehicle');
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    const models = getVehicleModels(vehicle.make);
    setAvailableModels(models);
    
    // Format the date properly for the date input
    const serviceDate = new Date(vehicle.nextServiceDate);
    let formattedDate = '';
    if (!isNaN(serviceDate.getTime())) {
      formattedDate = serviceDate.toISOString().split('T')[0];
    } else {
      // Fallback if date is invalid
      formattedDate = new Date().toISOString().split('T')[0];
    }
    
    // Get the driver ID properly
    let driverId = '';
    if (vehicle.driverId) {
      if (typeof vehicle.driverId === 'string') {
        driverId = vehicle.driverId;
      } else if (vehicle.driverId._id) {
        driverId = vehicle.driverId._id;
      }
    }
    
    setFormData({
      licensePlate: vehicle.licensePlate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
      nextServiceDate: formattedDate,
      odometer: vehicle.odometer,
      driverId: driverId
    });
    setShowModal(true);
  };

  const handleDelete = async (vehicleId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this vehicle?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchVehicles();
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const openCreateModal = () => {
    setEditingVehicle(null);
    setAvailableModels([]);
    setFormData({
      licensePlate: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      vin: '',
      nextServiceDate: '',
      odometer: 0,
      driverId: ''
    });
    setShowModal(true);
  };

  const getDriverName = (driverId: any) => {
    if (typeof driverId === 'object' && driverId) {
      return `${driverId.firstName} ${driverId.lastName}`;
    }
    return 'Unassigned';
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
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage vehicle fleet and driver assignments.
          </p>
        </div>
        {canManageVehicles && (
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Vehicle
          </button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Plate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Odometer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {canManageVehicles && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicles.map((vehicle) => (
                <tr key={vehicle._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-sm text-gray-500">VIN: {vehicle.vin}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vehicle.licensePlate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getDriverName(vehicle.driverId)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vehicle.odometer.toLocaleString()} mi</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(vehicle.nextServiceDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        vehicle.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : vehicle.status === 'maintenance'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {vehicle.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {vehicle.daysUntilService !== undefined && (
                        <span className="text-xs text-gray-500 mt-1">
                          {vehicle.daysUntilService < 0 
                            ? `${Math.abs(vehicle.daysUntilService)} days overdue`
                            : vehicle.daysUntilService <= 10
                            ? `${vehicle.daysUntilService} days until service`
                            : `${vehicle.daysUntilService} days until service`
                          }
                        </span>
                      )}
                    </div>
                  </td>
                  {canManageVehicles && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deactivate
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Plate</label>
                    <input
                      type="text"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">VIN</label>
                    <input
                      type="text"
                      value={formData.vin}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      maxLength={17}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Make</label>
                    <select
                      value={formData.make}
                      onChange={(e) => handleMakeChange(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Make</option>
                      {VEHICLE_BRANDS.map((brand, index) => (
                        <option key={`${brand.name}-${index}`} value={brand.name}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model</label>
                    <select
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={!formData.make || availableModels.length === 0}
                    >
                      <option value="">Select Model</option>
                      {availableModels.map((model, index) => (
                        <option key={`${model}-${index}`} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Odometer</label>
                    <input
                      type="number"
                      value={formData.odometer}
                      onChange={(e) => setFormData({ ...formData, odometer: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Next Service Date</label>
                    <input
                      type="date"
                      value={formData.nextServiceDate}
                      onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assign Driver</label>
                  <select
                    value={formData.driverId}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.firstName} {driver.lastName}
                      </option>
                    ))}
                  </select>
                </div>
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
                    {editingVehicle ? 'Update' : 'Create'}
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