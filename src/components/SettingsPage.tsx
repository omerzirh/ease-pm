import { useState } from 'react';
import LabelsSettings from './settings/LabelsSettings';
import AISettings from './settings/AISettings';
import GroupProjectSettings from './settings/GroupProjectSettings';
import GitlabSettings from './settings/GitlabSettings';
import PrefixesSettings from './settings/PrefixesSettings';

const tabs = [
  { id: 'labels', label: 'Labels' },
  { id: 'prefixes', label: 'Prefixes' },
  { id: 'ai', label: 'AI Provider' },
  { id: 'gitlab', label: 'GitLab' },
  { id: 'project', label: 'Project' },
];

const SettingsPage = () => {
  const [active, setActive] = useState('labels');

  const renderTab = () => {
    switch (active) {
      case 'labels':
        return <LabelsSettings />;
      case 'prefixes':
        return <PrefixesSettings />;
      case 'ai':
        return <AISettings />;
      case 'gitlab':
        return <GitlabSettings />;
      case 'project':
        return <GroupProjectSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      <aside className="w-48 border-r border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`w-full text-left px-2 py-1 rounded-md mb-1 ${
              active === t.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </aside>
      <main className="flex-1 p-6 overflow-auto">{renderTab()}</main>
    </div>
  );
};

export default SettingsPage;
