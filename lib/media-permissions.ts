export interface MediaPermissionsStatus {
    camera: PermissionState;
    microphone: PermissionState;
    hasAllPermissions: boolean;
}


export const checkMediaPermissions = async (): Promise<MediaPermissionsStatus> => {
    try {
        if (!navigator.permissions) {
            return await checkMediaPermissionsFallback();
        }

        const [cameraPermission, microphonePermission] = await Promise.all([
            navigator.permissions.query({ name: 'camera' as PermissionName }),
            navigator.permissions.query({ name: 'microphone' as PermissionName }),
        ]);

        const hasAllPermissions =
            cameraPermission.state === 'granted' &&
            microphonePermission.state === 'granted';

        return {
            camera: cameraPermission.state,
            microphone: microphonePermission.state,
            hasAllPermissions,
        };
    } catch (error) {
        console.warn('Error checking media permissions:', error);
        return await checkMediaPermissionsFallback();
    }
};


const checkMediaPermissionsFallback = async (): Promise<MediaPermissionsStatus> => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        stream.getTracks().forEach(track => track.stop());

        return {
            camera: 'granted',
            microphone: 'granted',
            hasAllPermissions: true,
        };
    } catch (error: any) {
        if (error.name === 'NotAllowedError') {
            return {
                camera: 'denied',
                microphone: 'denied',
                hasAllPermissions: false,
            };
        }

        return {
            camera: 'prompt',
            microphone: 'prompt',
            hasAllPermissions: false,
        };
    }
};


export const shouldShowPermissionsModal = async (): Promise<boolean> => {
    const permissions = await checkMediaPermissions();
    return !permissions.hasAllPermissions;
};