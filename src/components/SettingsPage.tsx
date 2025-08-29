import React from 'react';
import LabelsSettings from './settings/LabelsSettings';
import AISettings from './settings/AISettings';
import GroupProjectSettings from './settings/GroupProjectSettings';
import GitlabSettings from './settings/GitlabSettings';
import PrefixesSettings from './settings/PrefixesSettings';

interface SettingsPageProps {
  activeTab: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ activeTab }) => {
  const renderTab = () => {
    switch (activeTab) {
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
        return <LabelsSettings />; // Default to labels if unknown tab
    }
  };

  return (
    <div className="h-full">
      <main className="p-6 overflow-auto">{renderTab()}</main>
    </div>
  );
};

export default SettingsPage;
