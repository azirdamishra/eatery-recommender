import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api  from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Group {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  group_members: {
    id: number;
    user_id: number;
    group_id: number;
    is_admin: boolean;
    joined_at: string;
  }[];
}

interface Centroid {
  latitude: number;
  longitude: number;
  radius: number;
}

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [centroid, setCentroid] = useState<Centroid | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const [groupResponse, centroidResponse] = await Promise.all([
          api.get(`/group/${groupId}`),
          api.get(`/group/${groupId}/centroid`)
        ]);
        setGroup(groupResponse.data);
        setCentroid(centroidResponse.data);
      } catch (error) {
        console.error('Error fetching group data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroupData();
  }, [groupId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Group not found</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{group.name}</h3>
          {group.description && (
            <p className="mt-1 text-sm text-gray-500">{group.description}</p>
          )}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900">Members</h4>
            <ul className="mt-2 divide-y divide-gray-200">
              {group.group_members.map((member) => (
                <li key={member.id} className="py-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        User ID: {member.user_id}
                      </p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {member.is_admin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Admin
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {centroid && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Group Centroid</h3>
            <div className="mt-4 h-96 rounded-lg overflow-hidden">
              <MapContainer
                center={[centroid.latitude, centroid.longitude]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[centroid.latitude, centroid.longitude]}>
                  <Popup>
                    Group Centroid<br />
                    Radius: {centroid.radius}km
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 