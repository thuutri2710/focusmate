import React from "react";

interface DomainInputProps {
  domain: string;
  setDomain: (domain: string) => void;
}

const DomainInput: React.FC<DomainInputProps> = ({ domain, setDomain }) => {
  return (
    <div className="mb-3">
      <label htmlFor="domain-input" className="block text-sm font-medium text-gray-700 mb-1">
        Website to block
        <span className="relative ml-1 group">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 inline text-gray-400 cursor-help"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <div className="hidden group-hover:block absolute z-10 w-56 p-2 mt-1 text-xs bg-gray-700 text-white rounded shadow-lg left-0">
            <p className="font-medium mb-1">Format examples:</p>
            <ul className="space-y-1">
              <li>facebook.com (simple domain)</li>
              <li>*.facebook.com (with subdomains)</li>
              <li>/.*\.facebook\.com/ (regex pattern)</li>
            </ul>
          </div>
        </span>
      </label>
      <div className="relative">
        <input
          type="text"
          id="domain-input"
          className="w-full px-3 py-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., facebook.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          required
          autoFocus
        />
      </div>
    </div>
  );
};

export default DomainInput;
