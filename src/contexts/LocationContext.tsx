import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserLocation {
  neighborhood: string;
  city: string;
}

interface LocationContextType {
  userLocation: UserLocation | null;
  setUserLocation: (location: UserLocation) => void;
  clearUserLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocationState] = useState<UserLocation | null>(() => {
    const saved = localStorage.getItem("user_location");
    return saved ? JSON.parse(saved) : null;
  });

  const setUserLocation = (location: UserLocation) => {
    setUserLocationState(location);
    localStorage.setItem("user_location", JSON.stringify(location));
  };

  const clearUserLocation = () => {
    setUserLocationState(null);
    localStorage.removeItem("user_location");
  };

  return (
    <LocationContext.Provider value={{ userLocation, setUserLocation, clearUserLocation }}>
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
