const BASE_URL = import.meta.env.VITE_BASE_URL;
const buildHeaders = (isTokenRequired) => {
    const headers = {
        "Content-Type": "application/json",
    };

    if (isTokenRequired) {
        const token = localStorage.getItem("access_token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    return headers;
};

export const updateData = async (endpoint, updatedData, isTokenRequired = true) => {
    const completeURL = `${BASE_URL}/${endpoint}`;
    try {
        const response = await fetch(completeURL, {
            method: "PATCH",
            headers: buildHeaders(isTokenRequired),
            body: JSON.stringify(updatedData),
        });

        const data = await response.json();
        if (!response.ok) {
            return { error: data?.error || "Failed to update data" };
        }

        return data;
    } catch (error) {
        console.error("Error updating data:", error);
        return { error: "An unexpected error occurred while updating." };
    }
};

export const createFormData = async (endpoint, newData) => {
    const completeURL = `${BASE_URL}/${endpoint}`;

    try {
        const response = await fetch(completeURL, {
            method: "POST",
            body: newData,
        });

        const data = await response.json();
        if (!response.ok) {
            return { error: data?.error || data?.errors || "Failed to create data" };
        }

        return data;
    } catch (error) {
        console.error("Error creating data:", error);
        return { error: "An unexpected error occurred while creating." };
    }
};


export const createData = async (endpoint, newData, isTokenRequired = false) => {
    const completeURL = `${BASE_URL}/${endpoint}`;
    try {
        const response = await fetch(completeURL, {
            method: "POST",
            headers: buildHeaders(isTokenRequired),
            body: JSON.stringify(newData),
        });

        const data = await response.json();
        if (!response.ok) {
            console.log("Response: ", response);
            return { error: data?.error || data?.errors || data|| "Failed to create data" };
        }

        return data;
    } catch (error) {
        console.error("Error creating data:", error);
        return { error: "An unexpected error occurred while creating." };
    }
};

export const getData = async (endpoint, isTokenRequired = true) => {
    const completeURL = `${BASE_URL}/${endpoint}`;
    try {
        const response = await fetch(completeURL, {
            method: "GET",
            headers: buildHeaders(isTokenRequired),
        });

        const data = await response.json();
        if (!response.ok) {
            return { error: data?.error || "Failed to get data" };
        }

        return data;
    } catch (error) {
        console.error("Error retrieving data:", error);
        return { error: "An unexpected error occurred while retrieving." };
    }
};