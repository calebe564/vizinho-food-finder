import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface UserLocationData {
  neighborhood: string;
  city: string;
  coordinates?: Coordinates;
}

interface LocationContextType {
  userLocation: UserLocationData | null;
  coordinates: Coordinates | null;
  manualLocation: string;
  setUserLocation: (location: UserLocationData) => void;
  setManualLocation: (location: string) => void;
  clearUserLocation: () => void;
  isLoading: boolean;
  error: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocationState] = useState<UserLocationData | null>(() => {
    try {
      const saved = localStorage.getItem("user_location");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [manualLocation, setManualLocationState] = useState<string>(() => {
    try {
      return localStorage.getItem("manual_location") || "";
    } catch {
      return "";
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request geolocation on mount
  useEffect(() => {
    // Default coordinates (Barreiro, Belo Horizonte)
    const defaultCoords = { latitude: -19.9833, longitude: -44.0333 };
    
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo navegador");
      setCoordinates(defaultCoords);
      setIsLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setCoordinates(defaultCoords);
        setIsLoading(false);
      }
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        clearTimeout(timeoutId);
        console.warn("Geolocation error:", err.message);
        setError(err.message);
        setCoordinates(defaultCoords);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000,
      }
    );

    return () => clearTimeout(timeoutId);
  }, []);

  const setUserLocation = (location: UserLocationData) => {
    setUserLocationState(location);
    try {
      localStorage.setItem("user_location", JSON.stringify(location));
    } catch (e) {
      console.warn("Could not save location to localStorage", e);
    }
  };

  const setManualLocation = (location: string) => {
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
  };

  const clearUserLocation = () => {
    setUserLocationState(null);
    try {
      localStorage.removeItem("user_location");
    } catch (e) {
      console.warn("Could not clear location from localStorage", e);
    }
  };

  return (
    <LocationContext.Provider value={{ 
      userLocation, 
      coordinates, 
      manualLocation,
      setUserLocation, 
      setManualLocation,
      clearUserLocation,
      isLoading,
      error
    }}>
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
