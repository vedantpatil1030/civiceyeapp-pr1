import { useCallback } from 'react';

export const useToast = () => {
  const showToast = useCallback((message, type = 'success') => {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `px-4 py-2 rounded-md shadow-lg transform transition-all duration-300 opacity-0 translate-x-full
      ${type === 'success' ? 'bg-green-500 text-white' : ''}
      ${type === 'error' ? 'bg-red-500 text-white' : ''}
      ${type === 'warning' ? 'bg-yellow-500 text-white' : ''}
      ${type === 'info' ? 'bg-blue-500 text-white' : ''}`;
    toast.textContent = message;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Animate toast in
    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0', 'translate-x-full');
    });

    // Remove toast after delay
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => {
        toastContainer.removeChild(toast);
        if (toastContainer.children.length === 0) {
          document.body.removeChild(toastContainer);
        }
      }, 300);
    }, 3000);
  }, []);

  return {
    success: (message) => showToast(message, 'success'),
    error: (message) => showToast(message, 'error'),
    warning: (message) => showToast(message, 'warning'),
    info: (message) => showToast(message, 'info'),
  };
};