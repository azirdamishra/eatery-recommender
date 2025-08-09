import type { Libraries } from '@react-google-maps/api';

const libraries: Libraries = ["places"];

export const GOOGLE_MAPS_OPTIONS = {
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  libraries,
};

export const MAP_CONFIG = {
  defaultCenter: {
    lat: 40.7128,
    lng: -74.0060, // NYC default
  },
  defaultZoom: 13,
  containerStyle: {
    width: "100%",
    height: "500px",
  },
};
