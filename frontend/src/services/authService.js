import api from "./api";


export const loginUser = async (
    email,
    password
) => {

    const response = await api.post(
        "/auth/login/",
        {
            email,
            password
        }
    );


    return response.data;

};


export const signupUser = async (
    name,
    email,
    password,
    role
) => {

    const response = await api.post(
        "/auth/signup/",
        {
            name,
            email,
            password,
            role
        }
    );


    return response.data;

};