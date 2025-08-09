export interface Location {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  addedBy: string; // Anonymous name provided by user
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  locations: Location[];
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface CreateLocationRequest {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  addedBy: string;
}

export interface MapLocation {
  latitude: number;
  longitude: number;
}
