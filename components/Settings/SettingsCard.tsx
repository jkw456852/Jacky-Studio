import React from 'react';

interface SettingsCardProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    badge?: string;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, icon, children, badge }) => {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                            {title}
                            {badge && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] uppercase font-bold tracking-wider">
                                    {badge}
                                </span>
                            )}
                        </h3>
                        {description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>}
                    </div>
                </div>
            </div>
            <div className="space-y-4 pt-1 border-t border-gray-50">
                {children}
            </div>
        </div>
    );
};
