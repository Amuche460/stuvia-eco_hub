import React from 'react';

export default function Layout({ children, currentPageName }) {
  return (
    <div style={{ '--teal': '#1a6b62', '--teal-dark': '#0f4a44', '--gold': '#d4a833', '--gold-light': '#f0c040' }}>
      <style>{`
        :root {
          --color-primary: #1a6b62;
          --color-primary-dark: #0f4a44;
          --color-gold: #d4a833;
        }
      `}</style>
      {children}
    </div>
  );
}