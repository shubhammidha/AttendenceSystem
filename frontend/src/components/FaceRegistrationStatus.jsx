/**
 * Face Registration Status Hook
 * 
 * Purpose: Check if student has already registered face
 * 
 * Features:
 * - Checks face registration status for current user
 * - Returns boolean for registration status
 * - Caches status to avoid repeated API calls
 * 
 * Usage:
 * - Used in StudentAttendance to show/hide registration
 * - Prevents duplicate face registrations
 * - Improves UX by showing relevant options only
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

export const useFaceRegistrationStatus = () => {
    const [isRegistered, setIsRegistered] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkFaceRegistrationStatus();
    }, []);

    const checkFaceRegistrationStatus = async () => {
        try {
            const userId = localStorage.getItem("userId");
            
            if (!userId) {
                setLoading(false);
                return;
            }

            const res = await axios.get(
                `http://localhost:5000/api/face/status/${userId}`
            );

            setIsRegistered(res.data.faceRegistered || false);
        } catch (error) {
            console.error("Error checking face registration status:", error);
            setIsRegistered(false);
        } finally {
            setLoading(false);
        }
    };

    const refreshStatus = () => {
        setLoading(true);
        checkFaceRegistrationStatus();
    };

    return { isRegistered, loading, refreshStatus };
};
