import React, { useState, useEffect } from 'react';
import { DailyRoute, RouteStats } from '@fleet-management/shared';
import { formatDistance, formatDuration, formatSpeed, formatDate } from '@fleet-management/shared';
import { cn } from '../utils/cn';

const Routes: React.FC = () => {
  const [routes, setRoutes] = useState<DailyRoute[]>([]);
  const [stats, setStats] = useState<RouteStats | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<string[]>([]);

  // Get unique device IDs from routes
  useEffect(() => {
    const uniqueDevices = [...new Set(routes.map(route => route.deviceId))];
    setDevices(uniqueDevices);
    if (uniqueDevices.length > 0 && !selectedDevice) {
      setSelectedDevice(uniqueDevices[0]);
    }
  }, [routes, selectedDevice]);

  // Load routes
  useEffect(() => {
    loadRoutes();
  }, [selectedDevice, selectedDate]);

  // Load route statistics
  useEffect(() => {
    if (selectedDevice) {
      loadRouteStats();
    }
  }, [selectedDevice]);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      let url = '/api/location/routes/all';
      if (selectedDevice) {
        url = `/api/location/routes/device/${selectedDevice}`;
      }
      if (selectedDate) {
        url += `?date=${selectedDate}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setRoutes(data.data);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRouteStats = async () => {
    try {
      const response = await fetch(`/api/location/routes/stats/${selectedDevice}?days=7`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading route stats:', error);
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Route Tracking</h1>
        <p className="text-gray-600">View daily routes and statistics for all tracked devices</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Devices</option>
              {devices.map(device => (
                <option key={device} value={device}>
                  {device === 'unknown' ? 'Unknown Device' : device}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Dates</option>
              <option value={getTodayDate()}>Today</option>
              <option value={getYesterdayDate()}>Yesterday</option>
              <option value="2024-08-30">August 30, 2024</option>
              <option value="2024-08-29">August 29, 2024</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadRoutes}
              disabled={loading}
              className={cn(
                "w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? 'Loading...' : 'Refresh Routes'}
            </button>
          </div>
        </div>
      </div>

      {/* Route Statistics */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Route Statistics - {stats.deviceId === 'unknown' ? 'Unknown Device' : stats.deviceId}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalRoutes}</div>
              <div className="text-sm text-gray-600">Total Routes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatDistance(stats.totalDistance)}</div>
              <div className="text-sm text-gray-600">Total Distance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatDuration(stats.totalDuration)}</div>
              <div className="text-sm text-gray-600">Total Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{formatSpeed(stats.averageSpeed)}</div>
              <div className="text-sm text-gray-600">Avg Speed</div>
            </div>
          </div>
        </div>
      )}

      {/* Routes List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Daily Routes {selectedDevice && `- ${selectedDevice === 'unknown' ? 'Unknown Device' : selectedDevice}`}
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">Loading routes...</div>
          </div>
        ) : routes.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">No routes found for the selected criteria</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {routes.map((route, index) => (
              <div key={`${route.deviceId}-${route.date}-${index}`} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {formatDate(route.date, 'long')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Device: {route.deviceId === 'unknown' ? 'Unknown Device' : route.deviceId}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatDistance(route.totalDistance)}
                    </div>
                    <div className="text-sm text-gray-600">Total Distance</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Duration</div>
                    <div className="text-lg text-gray-900">{formatDuration(route.totalDuration)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Points</div>
                    <div className="text-lg text-gray-900">{route.totalPoints}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Avg Speed</div>
                    <div className="text-lg text-gray-900">{formatSpeed(route.averageSpeed)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Max Speed</div>
                    <div className="text-lg text-gray-900">{formatSpeed(route.maxSpeed)}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Start Location</div>
                    <div className="text-sm text-gray-900">
                      {route.startLocation.latitude.toFixed(6)}, {route.startLocation.longitude.toFixed(6)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatDate(route.startLocation.timestamp, 'time')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">End Location</div>
                    <div className="text-sm text-gray-900">
                      {route.endLocation.latitude.toFixed(6)}, {route.endLocation.longitude.toFixed(6)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatDate(route.endLocation.timestamp, 'time')}
                    </div>
                  </div>
                </div>
                
                {/* Route Points Preview */}
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Route Points ({route.routePoints.length})
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="text-xs text-gray-600 space-y-1">
                      {route.routePoints.slice(0, 10).map((point, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                          </span>
                          <span className="text-gray-500">
                            {formatDate(point.timestamp, 'time')}
                          </span>
                        </div>
                      ))}
                      {route.routePoints.length > 10 && (
                        <div className="text-gray-500 text-center pt-2">
                          ... and {route.routePoints.length - 10} more points
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Routes;
