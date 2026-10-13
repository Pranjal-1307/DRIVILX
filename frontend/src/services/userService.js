import api from "./api";

export const userService = {
    getProfile: async () => {
        const res = await api.get("/users/profile/");
        return res.data;
    },

    updateProfile: async (profileData) => {
        const res = await api.put("/users/profile/", profileData);
        return res.data;
    }
};
