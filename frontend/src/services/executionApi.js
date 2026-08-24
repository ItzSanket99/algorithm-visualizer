import axios from "axios";


const API_BASE_URL =
    "http://localhost:8080";


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