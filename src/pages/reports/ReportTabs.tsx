import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Essential', path: '/reports/essential' },
  { name: 'Advanced', path: '/reports/advanced' },
];

export const ReportTabs = () => {
  return (
    <div className="border-b">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            className={({ isActive }) =>
              cn(
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700'
              )
            }
          >
            {tab.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};