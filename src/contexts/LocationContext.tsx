import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationDetails {
  neighborhood: string;
  region: string;
  city: string;
  state: string;
}

interface UserLocationData {
  neighborhood: string;
  region: string;
  city: string;
  state: string;
  coordinates?: Coordinates;
}

interface LocationContextType {
  userLocation: UserLocationData | null;
  coordinates: Coordinates | null;
  locationDetails: LocationDetails | null;
  manualLocation: string;
  setUserLocation: (location: UserLocationData) => void;
  setManualLocation: (location: string) => void;
  setLocationDetails: (details: LocationDetails) => void;
  clearUserLocation: () => void;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Reverse geocoding using Nominatim (OpenStreetMap) - free API
async function reverseGeocode(lat: number, lon: number): Promise<LocationDetails | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'pt-BR',
          'User-Agent': 'ComercioVizinho/1.0'
        }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const address = data.address || {};
    
    return {
      neighborhood: address.suburb || address.neighbourhood || address.district || "",
      region: address.city_district || address.suburb || "",
      city: address.city || address.town || address.municipality || "",
      state: address.state || ""
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

function getInitialUserLocation(): UserLocationData | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("user_location");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function getInitialLocationDetails(): LocationDetails | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("location_details");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function getInitialManualLocation(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("manual_location") || "";
  } catch {
    return "";
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocationState] = useState<UserLocationData | null>(getInitialUserLocation);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationDetails, setLocationDetailsState] = useState<LocationDetails | null>(getInitialLocationDetails);
  const [manualLocation, setManualLocationState] = useState<string>(getInitialManualLocation);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const requestLocation = React.useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocalização não suportada pelo navegador");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoordinates(coords);
        setHasPermission(true);
        
        // Get location details via reverse geocoding
        const details = await reverseGeocode(coords.latitude, coords.longitude);
        if (details) {
          setLocationDetailsState(details);
          try {
            localStorage.setItem("location_details", JSON.stringify(details));
          } catch (e) {
            console.warn("Could not save location details to localStorage", e);
          }
          
          // Update user location with details
          const newLocation: UserLocationData = {
            ...details,
            coordinates: coords
          };
          setUserLocationState(newLocation);
          try {
            localStorage.setItem("user_location", JSON.stringify(newLocation));
          } catch (e) {
            console.warn("Could not save user location to localStorage", e);
          }
        }
        
        setIsLoading(false);
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setError(err.message);
        setHasPermission(false);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  // Request geolocation on mount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 10000);

    requestLocation();

    return () => clearTimeout(timeoutId);
  }, [requestLocation]);

  const setUserLocation = React.useCallback((location: UserLocationData) => {
    setUserLocationState(location);
    try {
      localStorage.setItem("user_location", JSON.stringify(location));
    } catch (e) {
      console.warn("Could not save location to localStorage", e);
    }
  }, []);

  const setLocationDetails = React.useCallback((details: LocationDetails) => {
    setLocationDetailsState(details);
    try {
      localStorage.setItem("location_details", JSON.stringify(details));
    } catch (e) {
      console.warn("Could not save location details to localStorage", e);
    }
  }, []);

  const setManualLocation = React.useCallback((location: string) => {
    setManualLocationState(location);
    try {
      if (location) {
        localStorage.setItem("manual_location", location);
      } else {
        localStorage.removeItem("manual_location");
      }
    } catch (e) {
      console.warn("Could not save manual location to localStorage", e);
    }
  }, []);

  const clearUserLocation = React.useCallback(() => {
    setUserLocationState(null);
    setLocationDetailsState(null);
    try {
      localStorage.removeItem("user_location");
      localStorage.removeItem("location_details");
    } catch (e) {
      console.warn("Could not clear location from localStorage", e);
    }
  }, []);

  const value = React.useMemo(() => ({
    userLocation, 
    coordinates,
    locationDetails,
    manualLocation,
    setUserLocation,
    setLocationDetails,
    setManualLocation,
    clearUserLocation,
    isLoading,
    error,
    hasPermission,
    requestLocation
  }), [
    userLocation, 
    coordinates, 
    locationDetails, 
    manualLocation, 
    setUserLocation, 
    setLocationDetails, 
    setManualLocation, 
    clearUserLocation, 
    isLoading, 
    error, 
    hasPermission, 
    requestLocation
  ]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

// Renamed to avoid conflict with react-router-dom's useLocation
export function useUserLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useUserLocation must be used within a LocationProvider");
  }
  return context;
}
