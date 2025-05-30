import React, { SelectHTMLAttributes, forwardRef } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: Option[];
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  className?: string;
  containerClassName?: string;
  onChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    label, 
    options, 
    error, 
    helperText, 
    fullWidth = false, 
    className = '', 
    containerClassName = '',
    onChange,
    ...rest 
  }, ref) => {
    const baseClasses = 'block px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1';
    const widthClass = fullWidth ? 'w-full' : '';
    const errorClass = error
      ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <div className={`${containerClassName} ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={rest.id || rest.name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`${baseClasses} ${errorClass} ${widthClass} ${className}`}
          onChange={handleChange}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
