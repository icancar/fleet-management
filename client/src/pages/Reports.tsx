import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '@shared/types';
import { apiConfig, getAuthHeaders } from '../config/api';

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ReportData {
  reportType: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  generatedBy: {
    userId: string;
    name: string;
    role: string;
  };
  summary: {
    totalDrivers: number;
    totalMileage: number;
    averageMileagePerDriver: number;
  };
  drivers: Array<{
    driverId: string;
    driverName: string;
    driverEmail: string;
    vehicle: {
      licensePlate: string;
      make: string;
      model: string;
      year: number;
      vin: string;
      odometer: number;
    } | null;
    totalMileage: number;
    averageSpeed: number;
    maxSpeed: number;
    dailyBreakdown: Array<{
      period: string;
      mileage: number;
      averageSpeed: number;
      maxSpeed: number;
    }>;
    monthlyBreakdown: Array<{
      period: string;
      mileage: number;
      averageSpeed: number;
      maxSpeed: number;
    }>;
  }>;
}

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'yearly'>('daily');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set default dates based on report type
  useEffect(() => {
    const today = new Date();
    
    if (reportType === 'daily') {
      setSelectedDate(today.toISOString().split('T')[0]);
    } else if (reportType === 'weekly') {
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      setEndDate(today.toISOString().split('T')[0]);
      setStartDate(lastWeek.toISOString().split('T')[0]);
    } else if (reportType === 'yearly') {
      setSelectedYear(today.getFullYear());
    }
  }, [reportType]);

  // Load available drivers
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const response = await fetch(apiConfig.endpoints.reports.drivers, {
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          throw new Error('Failed to load drivers');
        }

        const data = await response.json();
        setDrivers(data.data);
      } catch (error) {
        console.error('Error loading drivers:', error);
        setError('Failed to load drivers');
      }
    };

    loadDrivers();
  }, []);

  const handleDriverToggle = (driverId: string) => {
    setSelectedDrivers(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const handleSelectAllDrivers = () => {
    if (selectedDrivers.length === drivers.length) {
      setSelectedDrivers([]);
    } else {
      setSelectedDrivers(drivers.map(driver => driver._id));
    }
  };

  const generateReport = async (format: 'json' | 'pdf' = 'json') => {
    // Validate dates based on report type
    if (reportType === 'daily' && !selectedDate) {
      setError('Please select a date');
      return;
    }
    if (reportType === 'weekly' && (!startDate || !endDate)) {
      setError('Please select start and end dates');
      return;
    }
    if (reportType === 'yearly' && !selectedYear) {
      setError('Please select a year');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare date parameters based on report type
      let dateParams: any = { reportType, driverIds: selectedDrivers, format };
      
      if (reportType === 'daily') {
        dateParams.startDate = selectedDate;
        dateParams.endDate = selectedDate;
      } else if (reportType === 'weekly') {
        dateParams.startDate = startDate;
        dateParams.endDate = endDate;
      } else if (reportType === 'yearly') {
        dateParams.startDate = `${selectedYear}-01-01`;
        dateParams.endDate = `${selectedYear}-12-31`;
      }

      const response = await fetch(apiConfig.endpoints.reports.mileage, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dateParams)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate report';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      if (format === 'pdf') {
        // Handle PDF download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mileage-report-${reportType}-${startDate}-${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle JSON response
        const data = await response.json();
        setReportData(data.data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate detailed mileage reports and analytics.
        </p>
      </div>

      {/* Report Configuration */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'daily' | 'weekly' | 'yearly')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* Dynamic date selection based on report type */}
            {reportType === 'daily' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {reportType === 'weekly' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {reportType === 'yearly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="flex items-end">
              <button
                onClick={() => generateReport('json')}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {/* Driver Selection */}
          {user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Drivers
                </label>
                <button
                  onClick={handleSelectAllDrivers}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedDrivers.length === drivers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                {drivers.map((driver) => (
                  <label key={driver._id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDrivers.includes(driver._id)}
                      onChange={() => handleDriverToggle(driver._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {driver.firstName} {driver.lastName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => generateReport('pdf')}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : 'Download PDF'}
            </button>
            
            <button
              onClick={() => setReportData(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear Report
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Results</h2>
            
            {/* Report Header */}
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Report Type: <span className="font-medium">{reportData.reportType}</span></p>
                  <p className="text-sm text-gray-600">Period: <span className="font-medium">{formatDate(reportData.startDate)} - {formatDate(reportData.endDate)}</span></p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Generated: <span className="font-medium">{formatDateTime(reportData.generatedAt)}</span></p>
                  <p className="text-sm text-gray-600">By: <span className="font-medium">{reportData.generatedBy.name} ({reportData.generatedBy.role})</span></p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-600">Total Drivers</p>
                <p className="text-2xl font-bold text-blue-900">{reportData.summary.totalDrivers}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-sm text-green-600">Total Mileage</p>
                <p className="text-2xl font-bold text-green-900">{reportData.summary.totalMileage.toFixed(2)} km</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-md">
                <p className="text-sm text-purple-600">Avg Mileage/Driver</p>
                <p className="text-2xl font-bold text-purple-900">{reportData.summary.averageMileagePerDriver.toFixed(2)} km</p>
              </div>
            </div>

            {/* Driver Details */}
            <div className="space-y-6">
              {reportData.drivers.map((driver) => (
                <div key={driver.driverId} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{driver.driverName}</h3>
                      <p className="text-sm text-gray-600">{driver.driverEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{driver.totalMileage.toFixed(2)} km</p>
                      <p className="text-sm text-gray-600">Total Mileage</p>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  {driver.vehicle ? (
                    <div className="bg-gray-50 p-3 rounded-md mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Vehicle Information</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Vehicle</p>
                          <p className="font-medium">{driver.vehicle.year} {driver.vehicle.make} {driver.vehicle.model}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">License Plate</p>
                          <p className="font-medium">{driver.vehicle.licensePlate}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">VIN</p>
                          <p className="font-medium font-mono text-xs">{driver.vehicle.vin}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Odometer</p>
                          <p className="font-medium">{driver.vehicle.odometer.toLocaleString()} km</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-3 rounded-md mb-4">
                      <p className="text-yellow-800">No vehicle assigned to this driver</p>
                    </div>
                  )}

                  {/* Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{driver.averageSpeed.toFixed(1)} km/h</p>
                      <p className="text-sm text-gray-600">Avg Speed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{driver.maxSpeed.toFixed(1)} km/h</p>
                      <p className="text-sm text-gray-600">Max Speed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {driver.dailyBreakdown.length > 0 
                          ? (driver.totalMileage / driver.dailyBreakdown.length).toFixed(1)
                          : 0} km
                      </p>
                      <p className="text-sm text-gray-600">Avg Daily</p>
                    </div>
                  </div>

                  {/* Breakdown - only for Weekly and Yearly reports, not for Daily */}
                  {((reportType === 'yearly' && driver.monthlyBreakdown.length > 0) || 
                    (reportType === 'weekly' && driver.dailyBreakdown.length > 0)) && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        {reportType === 'yearly' ? 'Monthly Breakdown' : 'Daily Breakdown'}
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                {reportType === 'yearly' ? 'Month' : 'Date'}
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mileage</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Speed</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Max Speed</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(reportType === 'yearly' ? driver.monthlyBreakdown : driver.dailyBreakdown).map((period, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {reportType === 'yearly' ? formatMonth(period.period) : formatDate(period.period)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">{period.mileage.toFixed(2)} km</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{period.averageSpeed.toFixed(1)} km/h</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{period.maxSpeed.toFixed(1)} km/h</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
