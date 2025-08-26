import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';

export const Vehicles: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your fleet vehicles and track their status.
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select className="input">
                <option>All Status</option>
                <option>Active</option>
                <option>Maintenance</option>
                <option>Out of Service</option>
              </select>
              <select className="input">
                <option>All Fuel Types</option>
                <option>Gasoline</option>
                <option>Diesel</option>
                <option>Electric</option>
                <option>Hybrid</option>
              </select>
              <button className="btn-secondary">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Fleet Vehicles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Vehicle</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Driver</th>
                <th className="table-header-cell">Mileage</th>
                <th className="table-header-cell">Last Maintenance</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="table-row">
                  <td className="table-cell">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {['ABC-123', 'XYZ-789', 'DEF-456', 'GHI-789', 'JKL-012'][i - 1]}
                      </div>
                      <div className="text-sm text-gray-500">
                        {['Toyota Camry', 'Ford Transit', 'Honda Civic', 'Chevrolet Silverado', 'Nissan Altima'][i - 1]}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${
                      i === 1 ? 'badge-success' : 
                      i === 2 ? 'badge-warning' : 'badge-info'
                    }`}>
                      {i === 1 ? 'Active' : i === 2 ? 'Maintenance' : 'Active'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Tom Brown'][i - 1]}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {[12500, 8900, 15600, 11200, 9800][i - 1].toLocaleString()} mi
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {['2 days ago', '1 week ago', '3 days ago', '5 days ago', '1 day ago'][i - 1]}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button className="btn-sm btn-secondary">Edit</button>
                      <button className="btn-sm btn-danger">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
