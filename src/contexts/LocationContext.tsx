import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface UserLocation {
  neighborhood: string;
  city: string;
  coordinates?: Coordinates;
}

interface LocationContextType {
  userLocation: UserLocation | null;
  coordinates: Coordinates | null;
  manualLocation: string;
  setUserLocation: (location: UserLocation) => void;
  setManualLocation: (location: string) => void;
  clearUserLocation: () => void;
  isLoading: boolean;
  error: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocationState] = useState<UserLocation | null>(() => {
    const saved = localStorage.getItem("user_location");
    return saved ? JSON.parse(saved) : null;
  });
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [manualLocation, setManualLocationState] = useState<string>(() => {
    return localStorage.getItem("manual_location") || "";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo navegador");
      // Default to Barreiro, Belo Horizonte
      setCoordinates({ latitude: -19.9833, longitude: -44.0333 });
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setError(err.message);
        // Default to Barreiro, Belo Horizonte
        setCoordinates({ latitude: -19.9833, longitude: -44.0333 });
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, []);

  const setUserLocation = (location: UserLocation) => {
    setUserLocationState(location);
    localStorage.setItem("user_location", JSON.stringify(location));
  };

  const setManualLocation = (location: string) => {
    setManualLocationState(location);
    if (location) {
      localStorage.setItem("manual_location", location);
    } else {
      localStorage.removeItem("manual_location");
    }
  };

  const clearUserLocation = () => {
    setUserLocationState(null);
    localStorage.removeItem("user_location");
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

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
