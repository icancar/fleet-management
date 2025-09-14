import React, { useState, useEffect } from 'react';
import { Car, Users, AlertTriangle, Wrench, Clock, CheckCircle, RefreshCw, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { UserRole } from '@shared/types';

interface DashboardStats {
  vehicles: {
    total: number;
    active: number;
    maintenance: number;
    outOfService: number;
    unassigned: number;
    dueForService: number;
    overdue: number;
  };
  drivers: {
    total: number;
    assigned: number;
    unassigned: number;
  };
  mileage: {
    total: number;
    average: number;
  };
  // Driver-specific fields
  myVehicle?: {
    _id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    odometer: number;
    status: string;
    nextServiceDate: string;
    serviceInterval: number;
  };
}

interface RecentActivity {
  recentVehicles: any[];
  maintenanceAlerts: any[];
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingService, setProcessingService] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh data when component becomes visible (user navigates back to dashboard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData();
      }
    };

    const handleFocus = () => {
      fetchDashboardData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
        setRecentActivity(data.data.recentActivity);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleServiceDone = async (vehicleId: string) => {
    try {
      setProcessingService(vehicleId);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vehicles/${vehicleId}/service-done`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess(data.message);
        // Refresh dashboard data to reflect the changes
        fetchDashboardData(true);
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to mark service as done');
      }
    } catch (error) {
      console.error('Error marking service as done:', error);
      showError('Failed to mark service as done');
    } finally {
      setProcessingService(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load dashboard data</p>
      </div>
    );
  }

  // Role-specific stats cards
  const getStatsCards = () => {
    if (user?.role === UserRole.DRIVER) {
      // Driver-specific cards
      return [
        { 
          name: 'My Vehicle Status', 
          value: stats.myVehicle?.status === 'active' ? 'Active' : 'Maintenance', 
          icon: Car, 
          color: stats.myVehicle?.status === 'active' ? 'text-green-600' : 'text-yellow-600',
          bgColor: stats.myVehicle?.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'
        },
        { 
          name: 'Current Odometer', 
          value: stats.myVehicle ? `${stats.myVehicle.odometer.toLocaleString()} km` : 'N/A', 
          icon: Car, 
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        { 
          name: 'Next Service', 
          value: stats.myVehicle ? new Date(stats.myVehicle.nextServiceDate).toLocaleDateString() : 'N/A', 
          icon: Wrench, 
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        },
        { 
          name: 'Service Interval', 
          value: stats.myVehicle ? `${stats.myVehicle.serviceInterval.toLocaleString()} km` : 'N/A', 
          icon: Clock, 
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        },
      ];
    } else {
      // Admin/Manager cards
      return [
        { 
          name: 'Total Vehicles', 
          value: stats.vehicles.total.toString(), 
          icon: Car, 
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        { 
          name: 'Active Vehicles', 
          value: stats.vehicles.active.toString(), 
          icon: CheckCircle, 
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        { 
          name: 'Total Drivers', 
          value: stats.drivers.total.toString(), 
          icon: Users, 
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        },
        { 
          name: 'Assigned Drivers', 
          value: stats.drivers.assigned.toString(), 
          icon: Users, 
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100'
        },
        { 
          name: 'Maintenance Due', 
          value: stats.vehicles.dueForService.toString(), 
          icon: AlertTriangle, 
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        },
        { 
          name: 'Overdue Service', 
          value: stats.vehicles.overdue.toString(), 
          icon: Wrench, 
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        },
        { 
          name: 'Total Mileage', 
          value: `${stats.mileage.total.toLocaleString()} km`, 
          icon: Car, 
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100'
        },
        { 
          name: 'Average Mileage', 
          value: `${Math.round(stats.mileage.average).toLocaleString()} km`, 
          icon: Car, 
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-100'
        },
      ];
    }
  };

  const statsCards = getStatsCards();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.firstName}! Here's what's happening with your fleet today.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`h-8 w-8 rounded-full ${item.bgColor} flex items-center justify-center`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {item.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role-specific Additional Stats */}
      {user?.role === UserRole.DRIVER ? (
        /* Driver-specific vehicle details */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Vehicle Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">My Vehicle Details</h3>
              <div className="mt-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Vehicle</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.myVehicle ? `${stats.myVehicle.year} ${stats.myVehicle.make} ${stats.myVehicle.model}` : 'No vehicle assigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">License Plate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.myVehicle?.licensePlate || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Current Odometer</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.myVehicle ? `${stats.myVehicle.odometer.toLocaleString()} km` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`text-sm font-medium ${
                    stats.myVehicle?.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {stats.myVehicle?.status === 'active' ? 'Active' : 'Maintenance Required'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Maintenance Information</h3>
              <div className="mt-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Next Service Date</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.myVehicle ? new Date(stats.myVehicle.nextServiceDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Service Interval</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.myVehicle ? `${stats.myVehicle.serviceInterval.toLocaleString()} km` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Days Until Service</span>
                  <span className={`text-sm font-medium ${
                    stats.myVehicle && new Date(stats.myVehicle.nextServiceDate) < new Date() 
                      ? 'text-red-600' 
                      : stats.myVehicle && new Date(stats.myVehicle.nextServiceDate) <= new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
                      ? 'text-yellow-600'
                      : 'text-gray-900'
                  }`}>
                    {stats.myVehicle ? 
                      (() => {
                        const daysUntil = Math.ceil((new Date(stats.myVehicle.nextServiceDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days`;
                      })() 
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Admin/Manager additional stats */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Status Breakdown */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Vehicle Status</h3>
              <div className="mt-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Active</span>
                  <span className="text-sm font-medium text-gray-900">{stats.vehicles.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">In Maintenance</span>
                  <span className="text-sm font-medium text-gray-900">{stats.vehicles.maintenance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Out of Service</span>
                  <span className="text-sm font-medium text-gray-900">{stats.vehicles.outOfService}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Unassigned</span>
                  <span className="text-sm font-medium text-gray-900">{stats.vehicles.unassigned}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Assignment Status */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Driver Assignment</h3>
              <div className="mt-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Drivers</span>
                  <span className="text-sm font-medium text-gray-900">{stats.drivers.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Assigned to Vehicles</span>
                  <span className="text-sm font-medium text-gray-900">{stats.drivers.assigned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Unassigned</span>
                  <span className="text-sm font-medium text-gray-900">{stats.drivers.unassigned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Assignment Rate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.drivers.total > 0 ? Math.round((stats.drivers.assigned / stats.drivers.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role-specific Recent Activity */}
      {user?.role === UserRole.DRIVER ? (
        /* Driver-specific activity */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Vehicle Status */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">My Vehicle Status</h3>
              <div className="mt-5">
                {stats.myVehicle ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full ${
                        stats.myVehicle.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'
                      } flex items-center justify-center`}>
                        <Car className={`h-4 w-4 ${
                          stats.myVehicle.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                        }`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {stats.myVehicle.year} {stats.myVehicle.make} {stats.myVehicle.model}
                      </p>
                      <p className="text-sm text-gray-500">
                        {stats.myVehicle.licensePlate} • {stats.myVehicle.status === 'active' ? 'Active' : 'Maintenance Required'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        stats.myVehicle.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {stats.myVehicle.status === 'active' ? 'Active' : 'Maintenance'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No vehicle assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Maintenance Alerts for My Vehicle */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Maintenance Status</h3>
              <div className="mt-5">
                {stats.myVehicle ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full ${
                        new Date(stats.myVehicle.nextServiceDate) < new Date() 
                          ? 'bg-red-100' 
                          : new Date(stats.myVehicle.nextServiceDate) <= new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
                          ? 'bg-yellow-100'
                          : 'bg-green-100'
                      } flex items-center justify-center`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          new Date(stats.myVehicle.nextServiceDate) < new Date() 
                            ? 'text-red-600' 
                            : new Date(stats.myVehicle.nextServiceDate) <= new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Service Due - {stats.myVehicle.year} {stats.myVehicle.make} {stats.myVehicle.model}
                      </p>
                      <p className="text-sm text-gray-500">
                        {stats.myVehicle.licensePlate} • Due: {new Date(stats.myVehicle.nextServiceDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        new Date(stats.myVehicle.nextServiceDate) < new Date() 
                          ? 'bg-red-100 text-red-800' 
                          : new Date(stats.myVehicle.nextServiceDate) <= new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {new Date(stats.myVehicle.nextServiceDate) < new Date() 
                          ? 'Overdue' 
                          : new Date(stats.myVehicle.nextServiceDate) <= new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
                          ? 'Due Soon'
                          : 'Up to Date'
                        }
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No vehicle assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Admin/Manager recent activity */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Vehicles */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Vehicles</h3>
              <div className="mt-5 space-y-4">
                {recentActivity?.recentVehicles.length > 0 ? (
                  recentActivity.recentVehicles.map((vehicle, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Car className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-gray-500">
                          {vehicle.licensePlate} • {vehicle.driverId ? `${vehicle.driverId.firstName} ${vehicle.driverId.lastName}` : 'Unassigned'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-sm text-gray-500">
                        {new Date(vehicle.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent vehicles</p>
                )}
              </div>
            </div>
          </div>

          {/* Maintenance Alerts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Maintenance Alerts</h3>
              <div className="mt-5 space-y-4">
                {recentActivity?.maintenanceAlerts.length > 0 ? (
                  recentActivity.maintenanceAlerts.map((vehicle, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Service Due - {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-gray-500">
                          {vehicle.licensePlate} • Due: {new Date(vehicle.nextServiceDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          new Date(vehicle.nextServiceDate) < new Date() 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {new Date(vehicle.nextServiceDate) < new Date() ? 'Overdue' : 'Due Soon'}
                        </span>
                        <button
                          onClick={() => handleServiceDone(vehicle._id)}
                          disabled={processingService === vehicle._id}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingService === vehicle._id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Service Done
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No maintenance alerts</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role-specific Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {user?.role === UserRole.DRIVER ? (
              /* Driver-specific actions */
              <>
                <button 
                  onClick={() => window.location.href = '/routes'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Car className="mr-2 h-4 w-4" />
                  View My Routes
                </button>
                <button 
                  onClick={() => window.location.href = '/vehicles'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  My Vehicle
                </button>
                <button 
                  onClick={() => window.location.href = '/settings'}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Settings
                </button>
              </>
            ) : (
              /* Admin/Manager actions */
              <>
                <button 
                  onClick={() => window.location.href = '/vehicles'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Car className="mr-2 h-4 w-4" />
                  Manage Vehicles
                </button>
                <button 
                  onClick={() => window.location.href = '/drivers'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <Users className="mr-2 h-4 w-4" />
                  {user?.role === UserRole.ADMIN ? 'Manage Employees' : 'Manage Drivers'}
                </button>
                <button 
                  onClick={() => window.location.href = '/settings'}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Settings
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
