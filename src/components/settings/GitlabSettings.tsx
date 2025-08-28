import React, { useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import Modal from '../Modal';

const GitlabSettings: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    gitlabHost,
    gitlabAppId,
    gitlabCallbackUrl,
    setGitlabHost,
    setGitlabAppId,
    setGitlabCallbackUrl,
  } = useSettingsStore();

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">GitLab Settings</h2>
          <button onClick={() => setIsModalOpen(true)} className="text-sm text-blue-600 hover:underline">How to find this information?</button>
        </div>
        <div>
          <label htmlFor="gitlabHost" className="block text-sm font-medium text-gray-700">
            GitLab Host
          </label>
          <input
            type="text"
            id="gitlabHost"
            value={gitlabHost || ''}
            onChange={(e) => setGitlabHost(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="https://gitlab.com"
          />
        </div>
        <div>
          <label htmlFor="gitlabAppId" className="block text-sm font-medium text-gray-700">
            Application ID
          </label>
          <input
            type="text"
            id="gitlabAppId"
            value={gitlabAppId || ''}
            onChange={(e) => setGitlabAppId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="gitlabCallbackUrl" className="block text-sm font-medium text-gray-700">
            Callback URL
          </label>
          <input
            type="text"
            id="gitlabCallbackUrl"
            value={gitlabCallbackUrl || ''}
            onChange={(e) => setGitlabCallbackUrl(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configuring GitLab Connection">
        <p>To connect to GitLab, you need to create a new application in your GitLab account.</p>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            <strong>Navigate to GitLab Applications:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>Go to your GitLab profile settings (e.g., <code>https://gitlab.com/-/user_settings/profile</code>).</li>
              <li>Select "Applications" from the sidebar.</li>
            </ul>
          </li>
          <li>
            <strong>Create a new application:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>Click "New application".</li>
              <li><strong>Name:</strong> Give your application a descriptive name (e.g., "Ease GitLab").</li>
              <li><strong>Redirect URI:</strong> This must match the "Callback URL" you provide in the settings. For local development, this is often <code>http://localhost:5173</code>. You must add this URI to the application settings in GitLab.</li>
              <li><strong>Confidential:</strong> Leave this unchecked.</li>
              <li><strong>Scopes:</strong> Select the <code>api</code> scope. This grants the application access to the full API.</li>
              <li>Click "Save application".</li>
            </ul>
          </li>
          <li>
            <strong>Copy the credentials:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>After creating the application, you will see an <strong>Application ID</strong>. Copy this value and paste it into the "Application ID" field.</li>
              <li>The <strong>GitLab Host</strong> is the URL of your GitLab instance (e.g., <code>https://gitlab.com</code>).</li>
              <li>The <strong>Callback URL</strong> is the Redirect URI you configured in the GitLab application.</li>
            </ul>
          </li>
        </ol>
      </Modal>
    </>
  );
};

export default GitlabSettings;
