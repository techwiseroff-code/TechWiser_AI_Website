"use client"
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useUser = () => {
    const [user, setUser] = useState();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userToken = localStorage.getItem('userToken');
            if (userToken) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setUser({ token: userToken });
            } else {
                const newToken = uuidv4();
                localStorage.setItem('userToken', newToken);
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setUser({ token: newToken });
            }
        }
    }, []);

    return { user };
}
