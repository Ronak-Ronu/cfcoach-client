import axios from "axios";
import { ResponseType } from "@/types/api";
import { BACKEND_ENDPOINT } from "@/config";

/**
 * Dummy API call that returns a promise
 * @param token Some auth token
 * @param title Title or data to use
 * @returns Promise<ResponseType>
 */
export function createSomething(token: string, title: string): Promise<ResponseType> {
	return axios
		.post(BACKEND_ENDPOINT + "/some/endpoint", JSON.stringify({ title: title }), {
			headers: {
				"Content-Type": "application/json",
				Authorization: token, // bearer token to authenticate with server
			},
		})
		.then(function (response) {
			return {
				success: true,
				res: response.data,
			};
		})
		.catch(function (error) {
			// Check if server returned data otherwise return
			// error status text or custom message in absence
			return {
				success: false,
				res:
					error.response && error.response.data
						? error.response.data
						: error.response?.statusText || "Unable to reach server.",
			};
		});
}
