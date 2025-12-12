// src/hooks/useToast.js (opcional, para más simplicidad)
import { useNotification } from '../components/Notifications/NotificationSystem';

export const useToast = () => {
    const { showSuccess, showError, showWarning, showInfo, showConfirm } = useNotification();

    return {
        success: showSuccess,
        error: showError,
        warning: showWarning,
        info: showInfo,
        confirm: showConfirm
    };
};