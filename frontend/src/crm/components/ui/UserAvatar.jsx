import React from 'react';

/** Avatar vector neutro (sem indicação de género) */
const UserAvatar = ({ size = 40, className = '', iconClassName = '' }) => (
  <div
    className={`rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-emerald-100 to-teal-100 ring-2 ring-emerald-200/60 ${className}`}
    style={{ width: size, height: size }}
    aria-hidden
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={iconClassName}
      style={{ width: size * 0.55, height: size * 0.55 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="8" r="4" fill="currentColor" className="text-emerald-700" />
      <path
        d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-emerald-600"
      />
    </svg>
  </div>
);

export default UserAvatar;
