import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

/**
 * EmptyState component
 * @param {React.ReactNode} icon - lucide-react icon element to display
 * @param {string} title - primary heading
 * @param {string} description - secondary descriptive text
 * @param {function} action - callback for the action button
 * @param {string} actionLabel - label for the action button
 */

const EmptyState = ({
  icon,
  title,
  description,
  action,
  actionLabel,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          {typeof icon === 'function' || (typeof icon === 'object' && icon && !React.isValidElement(icon))
            ? React.createElement(icon, { size: 32, strokeWidth: 1.5 })
            : icon}
        </div>
      )}

      <h3 className="section-title text-xl mb-1">{title || t('nothingHere')}</h3>

      {description && (
        <p className="section-subtitle max-w-sm mt-1">{description}</p>
      )}

      {action && (
        <div className="mt-6">
          <Button variant="primary" size="md" onClick={action}>
            {actionLabel || t('getStarted')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
