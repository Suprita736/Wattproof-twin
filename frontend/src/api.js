
const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

const CV_URL =
    import.meta.env.VITE_CV_URL || "http://127.0.0.1:8001";

// Helper to handle API responses and errors
async function handleResponse(response) {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `API error (${response.status}): ${errorText || response.statusText}`
        );
    }

    return response.json();
}

// Detect equipment from an uploaded image using the CV service
export async function detectEquipment(imageFile) {
    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await fetch(`${CV_URL}/api/detect`, {
        method: "POST",
        body: formData,
    });

    return handleResponse(response);
}

// Fetch all equipment from the main backend
export async function getEquipment() {
    const response = await fetch(`${BACKEND_URL}/api/appliances/`);

    return handleResponse(response);
}

// Create and save an equipment record
export async function createEquipment(item) {
    const response = await fetch(`${BACKEND_URL}/api/appliances/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
    });

    return handleResponse(response);
}

export async function getEnergySummary() {
    const response = await fetch(`${BACKEND_URL}/api/energy/summary`);
    return handleResponse(response);
}

export async function updateEquipment(id, item) {
    const response = await fetch(`${BACKEND_URL}/api/appliances/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
    });

    return handleResponse(response);
}


export async function deleteEquipment(id) {
    const response = await fetch(`${BACKEND_URL}/api/appliances/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `API error (${response.status}): ${errorText || response.statusText}`
        );
    }
}
