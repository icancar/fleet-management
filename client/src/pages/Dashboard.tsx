import React from 'react';
import { Car, Users, MapPin, TrendingUp, AlertTriangle, Fuel, Wrench } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const stats = [
    { name: 'Total Vehicles', value: '24', icon: Car, change: '+2.5%', changeType: 'increase' },
    { name: 'Active Drivers', value: '18', icon: Users, change: '+1.2%', changeType: 'increase' },
    { name: 'Active Trips', value: '7', icon: MapPin, change: '-0.8%', changeType: 'decrease' },
    { name: 'Fuel Efficiency', value: '8.2', icon: Fuel, change: '+3.1%', changeType: 'increase' },
    { name: 'Maintenance Due', value: '3', icon: AlertTriangle, change: '+1', changeType: 'increase' },
    { name: 'Monthly Miles', value: '12,450', icon: TrendingUp, change: '+5.2%', changeType: 'increase' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your fleet today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <div key={item.name} className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {item.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        item.changeType === 'increase' ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {item.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trips */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Trips</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Trip #{1000 + i} - Downtown to Airport
                    </p>
                    <p className="text-sm text-gray-500">
                      Driver: John Doe • Vehicle: ABC-123
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    2h ago
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Maintenance Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Maintenance Alerts</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-warning-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-warning-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Oil Change Due
                    </p>
                    <p className="text-sm text-gray-500">
                      Vehicle: XYZ-789 • Due: Tomorrow
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="badge-warning">Due Soon</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="btn-primary w-full">
              <Car className="mr-2 h-4 w-4" />
              Add Vehicle
            </button>
            <button className="btn-secondary w-full">
              <Users className="mr-2 h-4 w-4" />
              Add Driver
            </button>
            <button className="btn-secondary w-full">
              <MapPin className="mr-2 h-4 w-4" />
              Plan Trip
            </button>
            <button className="btn-secondary w-full">
              <Wrench className="mr-2 h-4 w-4" />
              Schedule Maintenance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
