import axios from "axios";


const API_BASE_URL =
    "https://algotrace-backend-ydr1.onrender.com";


export async function executeCode(
    sourceCode
) {

    const response =
        await axios.post(
            `${API_BASE_URL}/api/execution/run`,
            {
                sourceCode
            }
        );


    return response.data;
}   