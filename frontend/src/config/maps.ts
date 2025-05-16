export const GOOGLE_MAPS_LIBRARIES: ("places" | "maps" | "marker" | "geocoding")[] = [
  "places",
  "maps",
  "marker",
  "geocoding"
];

export const GOOGLE_MAPS_OPTIONS = {
  id: 'google-map-script',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  libraries: GOOGLE_MAPS_LIBRARIES,
  version: "beta" // Use the beta version to access new features
}; 