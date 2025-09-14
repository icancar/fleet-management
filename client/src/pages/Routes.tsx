import React, { useState, useEffect, useRef } from 'react';
import { DailyRoute } from '../types/routes';
import { formatDistance, formatDuration, formatSpeed, formatDate } from '../utils/formatUtils';
import { cn } from '../utils/cn';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLocationEvents } from '../hooks/useLocationEvents';

// Declare Leaflet types for TypeScript
declare global {
  interface Window {
    L: any;
  }
}

const Routes: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [routes, setRoutes] = useState<DailyRoute[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([44.7865, 20.4489]); // Belgrade coordinates
  const [mapZoom, setMapZoom] = useState(13);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [lastDataTimestamp, setLastDataTimestamp] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Use Server-Sent Events for real-time location updates
  const token = localStorage.getItem('token');
  const { isConnected, lastUpdate: sseLocationUpdate, error: sseError, reconnect } = useLocationEvents(token);

  // Load routes when component mounts and when date changes
  useEffect(() => {
    loadRoutes();
  }, [selectedDate]);

  // React to Server-Sent Events for real-time location updates
  useEffect(() => {
    if (sseLocationUpdate) {
      console.log('SSE location update received, refreshing routes...');
      setIsUpdating(true);
      loadRoutes(true).finally(() => setIsUpdating(false));
    }
  }, [sseLocationUpdate]);

  // Show SSE connection status (only show errors, not connection success)
  useEffect(() => {
    if (sseError) {
      showNotification(`Real-time updates: ${sseError}`, 'warning');
    }
    // Removed success notification for connection to avoid annoying popups
  }, [sseError, showNotification]);

  // Load Leaflet.js and initialize map
  useEffect(() => {
    let isMounted = true;
    console.log('Map useEffect triggered, mapRef.current:', mapRef.current);

    const initializeMap = () => {
      if (isMounted && mapRef.current && window.L && !mapInstanceRef.current) {
        try {
          console.log('Initializing map...');
          
          // Calculate initial center from route data if available
          let initialCenter: [number, number] = [44.7865, 20.4489]; // Default to Belgrade
          let initialZoom = 15;
          
          if (routes.length > 0) {
            const allPoints: [number, number][] = [];
            routes.forEach(route => {
              if (route.routePoints && route.routePoints.length > 0) {
                route.routePoints.forEach(point => {
                  allPoints.push([point.latitude, point.longitude]);
                });
              }
            });
            
            if (allPoints.length > 0) {
              // Calculate center from route points
              const avgLat = allPoints.reduce((sum, point) => sum + point[0], 0) / allPoints.length;
              const avgLon = allPoints.reduce((sum, point) => sum + point[1], 0) / allPoints.length;
              initialCenter = [avgLat, avgLon];
              initialZoom = 15; // Closer zoom for route data
            }
          }
          
          // Initialize map with calculated center
          mapInstanceRef.current = window.L.map(mapRef.current).setView(initialCenter, initialZoom);
          
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
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
              
              // Draw routes immediately after map initialization if we have data
              if (routes.length > 0) {
                setTimeout(() => {
                  drawRoutesOnMap();
                }, 100);
              }
            }
          }, 200);
        } catch (error) {
          console.error('Error initializing map:', error);
          setMapError('Failed to initialize map');
          setMapLoading(false);
        }
      }
    };

    // Check if Leaflet is already loaded
    if (window.L) {
      console.log('Leaflet already loaded, initializing map...');
      setTimeout(initializeMap, 100);
    } else {
      // Load CSS first
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        console.log('Leaflet loaded successfully');
        if (isMounted) {
          setTimeout(initializeMap, 100);
        }
      };
      script.onerror = () => {
        console.error('Failed to load Leaflet');
        setMapError('Failed to load map library');
        setMapLoading(false);
      };
      document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
    };
  }, [routes]);

  // Draw routes when routes are updated
  useEffect(() => {
    console.log('Routes changed, routes:', routes);
    
    if (mapInstanceRef.current && mapRef.current && routes.length > 0) {
      console.log('Drawing routes for driver');
      // Add a small delay to ensure the map is fully rendered
      setTimeout(() => {
        drawRoutesOnMap();
      }, 50);
    }
  }, [routes]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);


  const loadRoutes = async (isRealtimeUpdate = false) => {
    if (!isRealtimeUpdate) {
      setLoading(true);
    }
    
    try {
      const token = localStorage.getItem('token');
      // Use the same endpoint as admin page for consistency
      const response = await fetch(`/api/admin-routes/drivers/${user?._id}/routes?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        // console.log('🔍 Routes data received:', data);
        
        // Extract routes from admin endpoint format (data.data.routes)
        const routesData = data.data.routes || [];
        
        // Check if we have new data by comparing timestamps and point counts
        let hasNewData = false;
        
        if (routes.length === 0) {
          hasNewData = true; // Initial load
        } else if (routesData.length > 0 && routesData[0].routePoints && routesData[0].routePoints.length > 0) {
          const newData = routesData[0];
          const lastPoint = newData.routePoints[newData.routePoints.length - 1];
          const newTimestamp = lastPoint.timestamp;
          
          // Check if we have more points or newer timestamp
          hasNewData = newData.routePoints.length > routes[0].routePoints.length ||
            (lastDataTimestamp && newTimestamp > lastDataTimestamp);
        }
        
        if (hasNewData || !isRealtimeUpdate) {
          // console.log('New route data detected, updating map...');
          
          // Check if this is a real-time update (not initial load)
          const isUpdate = routes.length > 0;
          
          setRoutes(routesData);
          setLastUpdate(new Date());
          
          // Update timestamp if we have new data
          if (routesData.length > 0 && routesData[0].routePoints && routesData[0].routePoints.length > 0) {
            const lastPoint = routesData[0].routePoints[routesData[0].routePoints.length - 1];
            setLastDataTimestamp(lastPoint.timestamp);
          }
          
          // Update map center if we have route data
          if (routesData.length > 0 && routesData[0].routePoints && routesData[0].routePoints.length > 0) {
            const firstPoint = routesData[0].routePoints[0];
            setMapCenter([firstPoint.latitude, firstPoint.longitude]);
          }
          
          // If this is a real-time update, smoothly update the map
          if (isUpdate && mapInstanceRef.current && routesData.length > 0) {
            updateMapSmoothly(routesData[0]);
          }
        } else {
          // console.log('No new route data, skipping update');
        }
      } else {
        console.error('Failed to load routes:', data);
        if (!isRealtimeUpdate) {
          showNotification('Error loading routes', 'error');
        }
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      if (!isRealtimeUpdate) {
        showNotification('Error loading routes', 'error');
      }
    } finally {
      if (!isRealtimeUpdate) {
        setLoading(false);
      }
    }
  };

  // Smooth map update function for real-time updates
  const updateMapSmoothly = (route: any) => {
    if (!mapInstanceRef.current || !route.routePoints || route.routePoints.length < 2) {
      return;
    }

    console.log('Smoothly updating map with', route.routePoints.length, 'points');
    
    // Clear existing route layers
    if (window.currentPolyline) {
      if (Array.isArray(window.currentPolyline)) {
        window.currentPolyline.forEach((polyline: any) => {
          mapInstanceRef.current.removeLayer(polyline);
        });
      } else {
        mapInstanceRef.current.removeLayer(window.currentPolyline);
      }
    }
    if (window.currentMarkers) {
      window.currentMarkers.forEach((marker: any) => {
        mapInstanceRef.current.removeLayer(marker);
      });
    }

    const points = route.routePoints;
    const routePoints = points.map((point: any) => [point.latitude, point.longitude]);
    
    // Create new polyline
    const polyline = window.L.polyline(routePoints, {
      color: 'blue',
      weight: 4,
      opacity: 0.8
    }).addTo(mapInstanceRef.current);
    
    // Add start and end markers
    const startMarker = window.L.marker(routePoints[0]).addTo(mapInstanceRef.current)
      .bindPopup(`<b>Start</b><br>${formatTime(points[0].timestamp)}`);
    
    const endMarker = window.L.marker(routePoints[routePoints.length - 1]).addTo(mapInstanceRef.current)
      .bindPopup(`<b>End</b><br>${formatTime(points[points.length - 1].timestamp)}`);
    
    // Store references
    window.currentPolyline = [polyline];
    window.currentMarkers = [startMarker, endMarker];
    
    // DO NOT change map view - let user maintain their current zoom and position
    console.log('Map updated smoothly without changing view');
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // Reset interaction flags when changing dates
    setIsInitialLoad(true);
    setUserHasInteracted(false);
  };


  const getDateOptions = () => {
    const options = [];
    const today = new Date();
    
    // Generate options for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const displayDate = date.toLocaleDateString('en-GB', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
      options.push({ value: dateString, label: displayDate });
    }
    
    return options;
  };

  const getMapBounds = () => {
    if (routes.length === 0 || routes[0].routePoints.length === 0) {
      return '20.4,44.7,20.6,44.8'; // Default Belgrade bounds
    }
    
    const points = routes[0].routePoints;
    let minLat = points[0].latitude;
    let maxLat = points[0].latitude;
    let minLng = points[0].longitude;
    let maxLng = points[0].longitude;
    
    points.forEach(point => {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLng = Math.min(minLng, point.longitude);
      maxLng = Math.max(maxLng, point.longitude);
    });
    
    // Add more padding for better view and ensure minimum bounds
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    
    const latPadding = Math.max(latRange * 0.3, 0.0005); // 30% padding or minimum
    const lngPadding = Math.max(lngRange * 0.3, 0.0005); // 30% padding or minimum
    
    return `${minLng - lngPadding},${minLat - latPadding},${maxLng + lngPadding},${maxLat + latPadding}`;
  };

  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return timestamp;
    }
  };

  // Function to draw routes on the map
  const drawRoutesOnMap = () => {
    if (!mapInstanceRef.current || !mapRef.current || routes.length === 0) {
      console.log('Cannot draw routes - missing requirements:', {
        hasMapInstance: !!mapInstanceRef.current,
        hasMapRef: !!mapRef.current,
        routesLength: routes.length
      });
      return;
    }
    
    console.log('Drawing routes on map:', {
      hasMapInstance: !!mapInstanceRef.current,
      hasMapRef: !!mapRef.current,
      routesLength: routes.length
    });
    
    // Clear existing layers (but keep the base map)
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof window.L.Polyline || layer instanceof window.L.Marker) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Initialize arrays for storing references
    window.currentPolyline = [];
    window.currentMarkers = [];

    // Draw all routes
    routes.forEach((route, index) => {
      if (route.routePoints && route.routePoints.length > 1) {
        console.log(`Drawing route ${index + 1} with ${route.routePoints.length} points`);
        
        const points = route.routePoints;
        const routePoints = points.map(point => [point.latitude, point.longitude]);
        
        try {
          // Create polyline
          const polyline = window.L.polyline(routePoints, {
            color: 'blue',
            weight: 4,
            opacity: 0.8
          }).addTo(mapInstanceRef.current);
          
          // Add start marker
          const startMarker = window.L.marker(routePoints[0]).addTo(mapInstanceRef.current)
            .bindPopup(`<b>Start</b><br>${formatTime(points[0].timestamp)}`);
          
          // Add end marker
          const endMarker = window.L.marker(routePoints[routePoints.length - 1]).addTo(mapInstanceRef.current)
            .bindPopup(`<b>End</b><br>${formatTime(points[points.length - 1].timestamp)}`);
          
          // Store references
          window.currentPolyline.push(polyline);
          window.currentMarkers.push(startMarker, endMarker);
        } catch (error) {
          console.error('Error drawing route:', error);
        }
      } else if (route.routePoints && route.routePoints.length === 1) {
        console.log('Drawing single point marker');
        const point = route.routePoints[0];
        try {
          const marker = window.L.marker([point.latitude, point.longitude]).addTo(mapInstanceRef.current)
            .bindPopup(`<b>Location</b><br>${formatTime(point.timestamp)}`);
          
          window.currentMarkers.push(marker);
        } catch (error) {
          console.error('Error drawing single point:', error);
        }
      }
    });

    // Only fit map to show the entire route on initial load or if user hasn't interacted
    if (routes.some(route => route.routePoints && route.routePoints.length > 0)) {
      const allPoints: [number, number][] = [];
      
      // Collect all route points for bounds calculation
      routes.forEach(route => {
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
          
          // Only fit bounds on initial load or if user hasn't interacted with the map
          if (isInitialLoad) {
            mapInstanceRef.current.fitBounds(bounds, {
              padding: [20, 20],
              maxZoom: 18 // Prevent zooming in too much
            });
            
            console.log('Map automatically focused on route endpoints (initial load)', {
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
          } else if (!userHasInteracted) {
            mapInstanceRef.current.fitBounds(bounds, {
              padding: [20, 20],
              maxZoom: 18
            });
            
            console.log('Map automatically focused on route endpoints (no user interaction)');
          } else {
            console.log('Skipping bounds fit - user has interacted with map');
          }
        } catch (error) {
          console.error('Error fitting map bounds:', error);
        }
      }
    }
  };

  const getRouteStats = () => {
    if (routes.length === 0) return null;
    
    console.log('🔍 getRouteStats called with routes:', routes);
    
    // Aggregate statistics from all routes (like admin view)
    let totalDistance = 0;
    let totalDuration = 0;
    let totalPoints = 0;
    let maxSpeed = 0;
    let totalSpeed = 0;
    let speedCount = 0;

    routes.forEach((route, index) => {
      console.log(`🔍 Processing route ${index}:`, {
        totalDistance: route.totalDistance,
        totalDuration: route.totalDuration,
        totalPoints: route.totalPoints,
        maxSpeed: route.maxSpeed,
        averageSpeed: route.averageSpeed,
        hasRoutePoints: !!route.routePoints,
        routePointsLength: route.routePoints?.length
      });
      
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

    const stats = {
      totalDistance,
      totalDuration,
      totalPoints,
      maxSpeed,
      averageSpeed
    };
    
    console.log('🔍 Final calculated stats:', stats);
    return stats;
  };

  const stats = getRouteStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Routes</h1>
        <p className="text-gray-600">View your daily routes and location history</p>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getDateOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
        </div>
      </div>

      {/* Route Statistics */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Route Statistics - {formatDate(selectedDate, 'long')}
            {routes.length > 1 && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({routes.length} devices)
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatDistance(stats.totalDistance * 1000)}</div>
              <div className="text-sm text-gray-600">Total Distance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatDuration(stats.totalDuration)}</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalPoints}</div>
              <div className="text-sm text-gray-600">Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{formatSpeed(stats.averageSpeed / 3.6)}</div>
              <div className="text-sm text-gray-600">Avg Speed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatSpeed(stats.maxSpeed / 3.6)}</div>
              <div className="text-sm text-gray-600">Max Speed</div>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Route Map - {formatDate(selectedDate, 'long')}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Real-time connected' : 'Real-time disconnected'}</span>
            </div>
            <span>Last updated: {lastUpdate.toLocaleTimeString('en-GB')}</span>
            {sseError && (
              <button
                onClick={reconnect}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-gray-500">Loading map...</div>
          </div>
        ) : routes.length === 0 ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-2">No routes found for this date</div>
              <div className="text-gray-400 text-sm">Try selecting a different date</div>
            </div>
          </div>
        ) : (
          <div className="h-96 relative">
            {/* Map with route path visualization using Leaflet.js like Android app */}
            <div className="w-full h-full bg-gray-100 relative overflow-hidden">
              <div 
                ref={mapRef}
                className="w-full h-full"
                style={{ 
                  zIndex: 1,
                  minHeight: '400px',
                  height: '100%'
                }}
              />
              
              {/* Loading state */}
              {mapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <div className="text-gray-600">Loading map...</div>
                  </div>
                    </div>
              )}
              
              {/* Error state */}
              {mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
                  <div className="text-center">
                    <div className="text-red-600 mb-2">⚠️ {mapError}</div>
                    <button 
                      onClick={() => {
                        setMapError(null);
                        setMapLoading(true);
                        // Reload the page to retry
                        window.location.reload();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
              
              {/* Manual refresh button */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => {
                    setIsUpdating(true);
                    loadRoutes(false).finally(() => setIsUpdating(false));
                  }}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                >
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                </button>
                  </div>


                
                    </div>
                  </div>
        )}
        
      </div>

      {/* Route Details */}
      {routes.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Route Details</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Start Location</h3>
                <div className="text-sm text-gray-600">
                  <div>Coordinates: {routes[0].startLocation.latitude.toFixed(6)}, {routes[0].startLocation.longitude.toFixed(6)}</div>
                  <div>Time: {formatTime(routes[0].startLocation.timestamp)}</div>
                </div>
                    </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">End Location</h3>
                <div className="text-sm text-gray-600">
                  <div>Coordinates: {routes[0].endLocation.latitude.toFixed(6)}, {routes[0].endLocation.longitude.toFixed(6)}</div>
                  <div>Time: {formatTime(routes[0].endLocation.timestamp)}</div>
                    </div>
                  </div>
                </div>
                
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Route Points ({routes[0].routePoints.length})
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="text-xs text-gray-600 space-y-1">
                  {routes[0].routePoints.slice(0, 20).map((point, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1">
                          <span>
                            {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                          </span>
                      <div className="flex space-x-2 text-gray-500">
                        <span>{formatTime(point.timestamp)}</span>
                        {point.speed && <span>{formatSpeed(point.speed)}</span>}
                      </div>
                        </div>
                      ))}
                  {routes[0].routePoints.length > 20 && (
                        <div className="text-gray-500 text-center pt-2">
                      ... and {routes[0].routePoints.length - 20} more points
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
          </div>
        )}
    </div>
  );
};

export default Routes;