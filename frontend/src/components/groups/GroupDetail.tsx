import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { LatLngTuple } from 'leaflet';
import api from '../../services/api';

// Fix for default marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Member {
  user_id: number;
  username: string;
  latitude?: number;
  longitude?: number;
  has_location: boolean;
  current_landmark?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  };
}

interface Group {
  id: number;
  name: string;
  description: string;
  members: Member[];
}

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const [groupResponse, locationsResponse] = await Promise.all([
          api.get(`/group/${groupId}`),
          api.get(`/group/${groupId}/member-locations`)
        ]);
        
        // Fetch current landmarks for each member
        const membersWithLandmarks = await Promise.all(
          locationsResponse.data.map(async (member: Member) => {
            try {
              const currentLandmark = await api.get(`/landmarks/current?user_id=${member.user_id}`);
              return {
                ...member,
                current_landmark: currentLandmark.data
              };
            } catch (err) {
              // If no current landmark, member will have has_location=false
              return member;
            }
          })
        );
        
        setGroup({
          ...groupResponse.data,
          members: membersWithLandmarks
        });
      } catch (err) {
        setError('Failed to load group data');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error || !group) {
    return <div className="p-4 text-red-500">{error || 'Group not found'}</div>;
  }

  // Fixed center calculation - only use members with valid locations
  const membersWithLocations = group.members.filter(
    m => m.has_location && 
         ((m.current_landmark && 
           typeof m.current_landmark.latitude === 'number' && 
           typeof m.current_landmark.longitude === 'number') ||
          (typeof m.latitude === 'number' && 
           typeof m.longitude === 'number')) &&
         !isNaN(m.latitude || m.current_landmark?.latitude || 0) && 
         !isNaN(m.longitude || m.current_landmark?.longitude || 0)
  );

  const center: LatLngTuple = membersWithLocations.length > 0
    ? [
        membersWithLocations.reduce((sum, m) => sum + (m.current_landmark?.latitude || m.latitude || 0), 0) / membersWithLocations.length,
        membersWithLocations.reduce((sum, m) => sum + (m.current_landmark?.longitude || m.longitude || 0), 0) / membersWithLocations.length
      ]
    : [40.7128, -74.0060]; // Default to NYC if no locations

  return (
    <div className="p-4 space-y-4">
      {/* Group Info */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-xl font-bold">{group.name}</h1>
          {group.description && (
          <p className="text-gray-600 mt-2">{group.description}</p>
        )}
                    </div>

      {/* Members List */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Members</h2>
        <ul className="space-y-2">
          {group.members.map(member => (
            <li key={member.user_id} className="flex justify-between items-center">
              <span>{member.username}</span>
              <span className={member.current_landmark ? 'text-green-500' : 'text-red-500'}>
                {member.current_landmark 
                  ? `Current: ${member.current_landmark.name}`
                  : 'Location not set'}
                    </span>
                </li>
              ))}
            </ul>
      </div>

      {/* Map */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Group Map</h2>
        <div className="h-[400px] rounded-lg overflow-hidden">
              <MapContainer
            center={center}
            zoom={membersWithLocations.length > 0 ? 13 : 10}
                style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
            {membersWithLocations.map(member => (
              <Marker
                key={member.user_id}
                position={[
                  member.current_landmark?.latitude || member.latitude!,
                  member.current_landmark?.longitude || member.longitude!
                ]}
              >
                  <Popup>
                  {member.username}'s location
                  {member.current_landmark && ` (${member.current_landmark.name})`}
                  </Popup>
                </Marker>
            ))}
              </MapContainer>
        </div>
        {membersWithLocations.length === 0 && (
          <p className="text-gray-500 text-sm mt-2">
            No member locations to display on the map.
          </p>
      )}
      </div>
    </div>
  );
} 