import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import GroupList from '../components/groups/GroupList';
import CreateGroupForm from '../components/groups/CreateGroupForm';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function FriendGroups() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Friend Groups</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage groups with your friends to find restaurants together.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="mt-4 sm:mt-0 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="mt-8">
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              My Groups
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              Create Group
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-4">
            <Tab.Panel>
              <GroupList />
            </Tab.Panel>
            <Tab.Panel>
              <CreateGroupForm onSuccess={() => setSelectedIndex(0)} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
} 