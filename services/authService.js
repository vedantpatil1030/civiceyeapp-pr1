// import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API = "http://localhost:8000/api/v1";

export const saveTokens = async (refreshAccessToken, refreshToken) => {
    // await AsyncStorage.setItem("accessToken", accessToken);
    // await AsyncStorage.setItem("refreshToken", refreshToken);
};

//Get Tokens
export const getAccessToken = async () => {
    // return await AsyncStorage.getItem("accessToken");
    return null;
};

export const getRefreshToken = async () => {
    // return await AsyncStorage.getItem("refreshToken");
    return null;
};

//Clear Tokens
export const clearTokens = async () => {
    // await AsyncStorage.removeItem("accessToken");
    // await AsyncStorage.removeItem("refreshToken");
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
