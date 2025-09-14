import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLocationEvents } from '../hooks/useLocationEvents';
import { UserRole } from '@shared/types';

// Extend window object for Leaflet
declare global {
  interface Window {
    L: any;
    currentPolyline: any;
    currentMarkers: any[];
  }
}

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  summary: {
    totalDistance: number;
    totalDuration: number;
    totalPoints: number;
    routeCount: number;
  };
}

interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  accuracy?: number;
}

interface DriverRoute {
  deviceId: string;
  routePoints: RoutePoint[];
  totalPoints: number;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  maxSpeed: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
}

// Helper function to format distance (same as driver page)
const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)}m`;
  }
  return `${distance.toFixed(2)}km`;
};

// Helper function to format duration (same as driver page)
const formatDuration = (duration: number): string => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Helper function to format speed (same as driver page)
const formatSpeed = (speed: number): string => {
  return `${speed.toFixed(1)} km/h`;
};

// Helper function to calculate total statistics from server data
const calculateTotalStats = (routes: DriverRoute[]) => {
  let totalDistance = 0;
  let totalDuration = 0;
  let totalPoints = 0;
  let maxSpeed = 0;
  let totalSpeed = 0;
  let speedCount = 0;

  routes.forEach(route => {
    if (route.totalDistance) totalDistance += route.totalDistance;
    if (route.totalDuration) totalDuration += route.totalDuration;
    if (route.totalPoints) totalPoints += route.totalPoints;
    if (route.maxSpeed && route.maxSpeed > maxSpeed) maxSpeed = route.maxSpeed;
    if (route.averageSpeed) {
      totalSpeed += route.averageSpeed;
      speedCount++;
    }
  });

  const averageSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;

  return {
    totalDistance,
    totalDuration,
    totalPoints,
    maxSpeed,
    averageSpeed
  };
};

const AdminRoutes: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { sseLocationUpdate } = useLocationEvents();
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverRoutes, setDriverRoutes] = useState<DriverRoute[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Refs for map
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Load drivers on component mount
  useEffect(() => {
    loadDrivers();
  }, []);

  // Load driver routes when driver or date changes
  useEffect(() => {
    if (selectedDriver) {
      loadDriverRoutes(selectedDriver._id);
    }
  }, [selectedDriver, selectedDate]);

  // Handle real-time updates
  useEffect(() => {
    if (sseLocationUpdate && selectedDriver) {
      console.log('SSE location update received for admin view');
      loadDriverRoutes(selectedDriver._id, true);
    }
  }, [sseLocationUpdate, selectedDriver]);

  // Draw routes when driver routes are updated
  useEffect(() => {
    if (mapInstanceRef.current && mapRef.current && driverRoutes.length > 0) {
      // Add a small delay to ensure the map is fully rendered
      setTimeout(() => {
        drawRoutesOnMap();
      }, 50);
    }
  }, [driverRoutes]);

  // Load Leaflet.js dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Check if Leaflet is already loaded
        if (window.L) {
          console.log('Leaflet already loaded');
          setMapLoading(false);
          return;
        }
        
        console.log('Loading Leaflet.js...');

        // Load CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        cssLink.crossOrigin = '';
        document.head.appendChild(cssLink);

        // Load JavaScript
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        
        script.onload = () => {
          console.log('Leaflet loaded successfully');
          setMapLoading(false);
          setMapError(null);
        };
        
        script.onerror = () => {
          console.error('Failed to load Leaflet');
          setMapError('Failed to load map library');
          setMapLoading(false);
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
        setMapError('Failed to load map library');
        setMapLoading(false);
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map when Leaflet is loaded and we have route data
  useEffect(() => {
    const initializeMap = () => {
      console.log('Attempting to initialize map:', {
        mapLoading,
        mapError,
        hasMapRef: !!mapRef.current,
        hasLeaflet: !!window.L,
        hasMapInstance: !!mapInstanceRef.current,
        selectedDriver: selectedDriver?.firstName,
        driverRoutesLength: driverRoutes.length
      });
      
      if (!mapLoading && !mapError && mapRef.current && window.L && !mapInstanceRef.current && driverRoutes.length > 0) {
        console.log('Initializing map for admin routes with route data');
        
        // Calculate initial center from route data
        const allPoints: [number, number][] = [];
        driverRoutes.forEach(route => {
          if (route.routePoints && route.routePoints.length > 0) {
            route.routePoints.forEach(point => {
              allPoints.push([point.latitude, point.longitude]);
            });
          }
        });
        
        let initialCenter: [number, number] = [44.7865, 20.4489]; // Default to Belgrade
        let initialZoom = 13;
        
        if (allPoints.length > 0) {
          // Calculate center from route points
          const avgLat = allPoints.reduce((sum, point) => sum + point[0], 0) / allPoints.length;
          const avgLon = allPoints.reduce((sum, point) => sum + point[1], 0) / allPoints.length;
          initialCenter = [avgLat, avgLon];
          initialZoom = 15; // Closer zoom for route data
        }
        
        // Initialize map with calculated center
        mapInstanceRef.current = window.L.map(mapRef.current, {
          center: initialCenter,
          zoom: initialZoom
        });

        // Add CartoDB tiles (consistent with Android app)
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 20,
          subdomains: 'abcd',
          userAgent: 'FleetManagement/1.0'
        }).addTo(mapInstanceRef.current);
        
        console.log('Map initialized successfully with center:', initialCenter);
        setMapLoading(false);
        setMapError(null);
        
        // Add event listeners to track user interaction
        mapInstanceRef.current.on('zoomend', () => {
          setUserHasInteracted(true);
        });
        
        mapInstanceRef.current.on('moveend', () => {
          setUserHasInteracted(true);
        });
        
        // Trigger map resize after a short delay to ensure proper rendering
        setTimeout(() => {
          if (mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current.invalidateSize();
            
            // Draw routes immediately after map initialization
            if (driverRoutes.length > 0) {
              setTimeout(() => {
                drawRoutesOnMap();
              }, 100);
            }
          }
        }, 100);
      }
    };

    // Only try to initialize if we have a selected driver AND route data
    if (selectedDriver && driverRoutes.length > 0) {
      // Add a small delay to ensure the map container is rendered
      const timer = setTimeout(() => {
        initializeMap();
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [mapLoading, mapError, selectedDriver, driverRoutes]);

  // Cleanup map when no driver is selected or no route data
  useEffect(() => {
    if ((!selectedDriver || driverRoutes.length === 0) && mapInstanceRef.current) {
      console.log('Cleaning up map - no driver selected or no route data');
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      setUserHasInteracted(false);
      setIsInitialLoad(true);
    }
  }, [selectedDriver, driverRoutes]);

  // Draw routes on map when driver routes change
  useEffect(() => {
    console.log('Route drawing effect triggered:', {
      hasMapInstance: !!mapInstanceRef.current,
      hasMapRef: !!mapRef.current,
      driverRoutesLength: driverRoutes.length,
      selectedDriver: selectedDriver?.firstName
    });
    
    if (mapInstanceRef.current && mapRef.current && driverRoutes.length > 0) {
      console.log('Drawing routes for selected driver');
      // Add a small delay to ensure the map is fully rendered
      setTimeout(() => {
        drawRoutesOnMap();
      }, 50);
    }
  }, [driverRoutes, isInitialLoad, userHasInteracted]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin-routes/drivers/summary?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setDrivers(data.data);
        console.log('Loaded drivers:', data.data.length);
      } else {
        showNotification('Error loading drivers', 'error');
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      showNotification('Error loading drivers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDriverRoutes = async (driverId: string, isRealtimeUpdate = false) => {
    if (!isRealtimeUpdate) {
      setLoading(true);
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin-routes/drivers/${driverId}/routes?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('Driver routes data received:', {
          success: data.success,
          routesCount: data.data.routes.length,
          routes: data.data.routes.map((route: any) => ({
            deviceId: route.deviceId,
            pointsCount: route.routePoints?.length || 0,
            hasPoints: !!(route.routePoints && route.routePoints.length > 0),
            firstPoint: route.routePoints?.[0],
            lastPoint: route.routePoints?.[route.routePoints?.length - 1]
          }))
        });
        
        // Check if we have new data by comparing timestamps and point counts
        let hasNewData = false;
        
        if (driverRoutes.length === 0) {
          hasNewData = true; // Initial load
        } else if (data.data.routes.length > 0 && data.data.routes[0].routePoints && data.data.routes[0].routePoints.length > 0) {
          const newTotalPoints = data.data.routes.reduce((total: number, route: any) => total + route.totalPoints, 0);
          const currentTotalPoints = driverRoutes.reduce((total, route) => total + route.totalPoints, 0);
          
          if (newTotalPoints > currentTotalPoints) {
            hasNewData = true;
          }
        }
        
        if (hasNewData) {
          setDriverRoutes(data.data.routes);
          console.log('Updated driver routes with new data, routes:', data.data.routes.length);
        }
      } else {
        console.error('Failed to load driver routes:', data);
        if (!isRealtimeUpdate) {
          showNotification('Error loading driver routes', 'error');
        }
      }
    } catch (error) {
      console.error('Error loading driver routes:', error);
      if (!isRealtimeUpdate) {
        showNotification('Error loading driver routes', 'error');
      }
    } finally {
      if (!isRealtimeUpdate) {
        setLoading(false);
      }
    }
  };

  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver);
    setDriverRoutes([]);
    setUserHasInteracted(false);
    setIsInitialLoad(true);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    setSelectedDate(newDate);
    setUserHasInteracted(false);
    setIsInitialLoad(true);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Function to draw routes on the map
  const drawRoutesOnMap = () => {
    if (!mapInstanceRef.current || !mapRef.current || driverRoutes.length === 0) {
      console.log('Cannot draw routes - missing requirements:', {
        hasMapInstance: !!mapInstanceRef.current,
        hasMapRef: !!mapRef.current,
        driverRoutesLength: driverRoutes.length
      });
      return;
    }
    
    console.log('Drawing routes on map:', {
      hasMapInstance: !!mapInstanceRef.current,
      hasMapRef: !!mapRef.current,
      driverRoutesLength: driverRoutes.length,
      selectedDriver: selectedDriver?.firstName
    });
    
    // Clear existing layers (but keep the base map)
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof window.L.Polyline || layer instanceof window.L.Marker) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Draw all routes for the selected driver
    driverRoutes.forEach((route, index) => {
      if (route.routePoints && route.routePoints.length > 1) {
        console.log(`Drawing route ${index + 1} with ${route.routePoints.length} points`);
        
        const points = route.routePoints;
        const routePoints = points.map(point => [point.latitude, point.longitude]);
        
        try {
          // Create polyline with different colors for different devices
          const colors = ['blue', 'red', 'green', 'orange', 'purple'];
          const color = colors[index % colors.length];
          
          const polyline = window.L.polyline(routePoints, {
            color: color,
            weight: 4,
            opacity: 0.8
          }).addTo(mapInstanceRef.current);
          
          // Add start marker
          const startMarker = window.L.marker(routePoints[0]).addTo(mapInstanceRef.current)
            .bindPopup(`<b>Start - ${route.vehicleInfo.licensePlate}</b><br>${formatTime(points[0].timestamp)}`);
          
          // Add end marker
          const endMarker = window.L.marker(routePoints[routePoints.length - 1]).addTo(mapInstanceRef.current)
            .bindPopup(`<b>End - ${route.vehicleInfo.licensePlate}</b><br>${formatTime(points[points.length - 1].timestamp)}`);
          
          // Store references
          if (!window.currentPolyline) window.currentPolyline = [];
          if (!window.currentMarkers) window.currentMarkers = [];
          window.currentPolyline.push(polyline);
          window.currentMarkers.push(startMarker, endMarker);
        } catch (error) {
          console.error('Error drawing route:', error);
        }
      }
    });

    // Fit map to show the entire route
    if (driverRoutes.some(route => route.routePoints && route.routePoints.length > 0)) {
      const allPoints: [number, number][] = [];
      
      // Collect all route points for bounds calculation
      driverRoutes.forEach(route => {
        if (route.routePoints && route.routePoints.length > 0) {
          route.routePoints.forEach(point => {
            allPoints.push([point.latitude, point.longitude]);
          });
        }
      });
      
      if (allPoints.length > 0) {
        try {
          // Create a bounds object from all points
          const bounds = window.L.latLngBounds(allPoints);
          
          // Force fit bounds immediately
          mapInstanceRef.current.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: 18 // Prevent zooming in too much
          });
          
          console.log('Map automatically focused on route endpoints', {
            pointCount: allPoints.length,
            bounds: bounds,
            center: bounds.getCenter()
          });
          
          // Ensure the map is properly rendered
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
              mapInstanceRef.current.fitBounds(bounds, {
                padding: [20, 20],
                maxZoom: 18
              });
            }
          }, 100);
          
          setIsInitialLoad(false);
        } catch (error) {
          console.error('Error fitting map bounds:', error);
        }
      }
    }
  };

  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Driver Routes</h1>
          <p className="mt-2 text-gray-600">View and monitor routes for all drivers in your fleet</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Drivers List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Drivers</h2>
                <div className="mt-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading drivers...</p>
                  </div>
                ) : drivers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>No drivers found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {drivers.map((driver) => (
                      <button
                        key={driver._id}
                        onClick={() => handleDriverSelect(driver)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          selectedDriver?._id === driver._id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {driver.firstName} {driver.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{driver.email}</p>
                            {driver.vehicle && (
                              <p className="text-xs text-gray-500">
                                {driver.vehicle.make} {driver.vehicle.model} ({driver.vehicle.licensePlate})
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{driver.summary.totalDistance.toFixed(2)} km</p>
                            <p>{formatDuration(calculateTotalStats(driver.routes).totalDuration)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map and Route Details */}
          <div className="lg:col-span-2">
            {selectedDriver ? (
              <div className="space-y-6">
                {/* Selected Driver Info */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedDriver.firstName} {selectedDriver.lastName}
                  </h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{selectedDriver.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium">{selectedDriver.phone || 'N/A'}</p>
                    </div>
                    {selectedDriver.vehicle && (
                      <>
                        <div>
                          <span className="text-gray-600">Vehicle:</span>
                          <p className="font-medium">
                            {selectedDriver.vehicle.make} {selectedDriver.vehicle.model} ({selectedDriver.vehicle.year})
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">License Plate:</span>
                          <p className="font-medium">{selectedDriver.vehicle.licensePlate}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Map or No Data Message */}
                {driverRoutes.length > 0 ? (
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
                      <p className="text-sm text-gray-600">
                        {driverRoutes.length} device(s) - {formatDistance(calculateTotalStats(driverRoutes).totalDistance)} - {formatDuration(calculateTotalStats(driverRoutes).totalDuration)}
                      </p>
                    </div>
                    
                    <div className="relative">
                      {mapLoading ? (
                        <div className="h-96 flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading map...</p>
                          </div>
                        </div>
                      ) : mapError ? (
                        <div className="h-96 flex items-center justify-center">
                          <div className="text-center text-red-600">
                            <p>{mapError}</p>
                            <button
                              onClick={() => window.location.reload()}
                              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Retry
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          ref={mapRef}
                          className="h-96 w-full"
                          style={{ minHeight: '400px', height: '100%' }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow h-96 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Route Data</h3>
                      <p className="text-sm text-gray-600">
                        No location data available for {selectedDate}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Try selecting a different date or check if the driver was active
                      </p>
                    </div>
                  </div>
                )}

                {/* Statistics Summary */}
                {driverRoutes.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{formatDistance(calculateTotalStats(driverRoutes).totalDistance)}</div>
                        <div className="text-sm text-gray-600">Total Distance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{formatDuration(calculateTotalStats(driverRoutes).totalDuration)}</div>
                        <div className="text-sm text-gray-600">Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{calculateTotalStats(driverRoutes).totalPoints}</div>
                        <div className="text-sm text-gray-600">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{formatSpeed(calculateTotalStats(driverRoutes).averageSpeed)}</div>
                        <div className="text-sm text-gray-600">Avg Speed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{formatSpeed(calculateTotalStats(driverRoutes).maxSpeed)}</div>
                        <div className="text-sm text-gray-600">Max Speed</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Route Details */}
                {driverRoutes.length > 0 && (
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Route Details</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {driverRoutes.map((route, index) => (
                        <div key={route.deviceId} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            Device {route.deviceId}
                          </h4>
                          <span className="text-sm text-gray-600">
                            {formatDistance(route.totalDistance || 0)}
                          </span>
                        </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600">
                            <div>
                              <span>Start Time:</span>
                              <p className="font-medium">
                                {route.startTime ? formatTime(route.startTime) : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span>End Time:</span>
                              <p className="font-medium">
                                {route.endTime ? formatTime(route.endTime) : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span>Duration:</span>
                              <p className="font-medium">
                                {formatDuration(route.totalDuration || 0)}
                              </p>
                            </div>
                            <div>
                              <span>Avg Speed:</span>
                              <p className="font-medium">
                                {formatSpeed(route.averageSpeed || 0)}
                              </p>
                            </div>
                            <div>
                              <span>Max Speed:</span>
                              <p className="font-medium">
                                {formatSpeed(route.maxSpeed || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-lg">Select a driver to view their routes</p>
                  <p className="text-sm mt-2">Choose a driver from the list to see their route map and details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRoutes;
