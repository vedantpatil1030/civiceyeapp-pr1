import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API = "http://10.0.2.2:8000/api/v1";  // Android Studio emulator special IP

export const saveTokens = async (accessToken, refreshToken, user = null) => {
    try {
        console.log('💾 Saving tokens:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            hasUser: !!user,
            accessTokenLength: accessToken?.length,
            refreshTokenLength: refreshToken?.length
        });

        if (!accessToken || !refreshToken) {
            console.error('❌ Invalid tokens provided');
            return false;
        }

        await AsyncStorage.multiSet([
            ["accessToken", accessToken],
            ["refreshToken", refreshToken],
            ...(user ? [["user", JSON.stringify(user)]] : [])
        ]);

        // Verify tokens were saved correctly
        const savedAccessToken = await AsyncStorage.getItem("accessToken");
        const savedRefreshToken = await AsyncStorage.getItem("refreshToken");

        if (!savedAccessToken || !savedRefreshToken) {
            console.error('❌ Token verification failed after save');
            return false;
        }

        console.log('✅ Tokens saved and verified successfully');
        return true;
    } catch (error) {
        console.error("❌ Error saving tokens:", error);
        return false;
    }
};

//Get Tokens
export const getAccessToken = async () => {
    try {
        const token = await AsyncStorage.getItem("accessToken");
        return token || null;
    } catch (error) {
        console.error("Error getting access token:", error);
        return null;
    }
};

export const getRefreshToken = async () => {
    try {
        const token = await AsyncStorage.getItem("refreshToken");
        return token || null;
    } catch (error) {
        console.error("Error getting refresh token:", error);
        return null;
    }
};

//Clear Tokens
export const clearTokens = async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");
};

export const refreshTokens = async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
        const res = await axios.post(`${API}/users/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;

        await saveTokens(accessToken, newRefreshToken);
        return accessToken;
    } catch (err) {
        await clearTokens();
        return null;
    }
};
