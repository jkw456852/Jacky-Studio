import React from 'react';

interface SettingsControlProps {
    label: string;
    description?: string;
    children: React.ReactNode;
}

export const SettingsControl: React.FC<SettingsControlProps> = ({ label, description, children }) => (
    <div className="flex items-center justify-between gap-6 py-1">
        <div className="flex-1">
            <label className="text-sm font-medium text-gray-800 block mb-0.5">{label}</label>
            {description && <p className="text-[11px] text-gray-500 leading-tight">{description}</p>}
        </div>
        <div className="flex-shrink-0">
            {children}
        </div>
    </div>
);

export const SettingsToggle: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-10 h-5 rounded-full transition-all duration-300 relative ${active ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${active ? 'translate-x-5' : ''}`} />
    </button>
);

export const SettingsInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className={`bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block w-full p-2 outline-none transition-all ${props.className || ''}`}
    />
);

export const SettingsSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        className={`bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block w-full p-2 outline-none transition-all appearance-none ${props.className || ''}`}
    >
        {props.children}
    </select>
);
