import axios from "axios";

/**
 * API call that returns a promise
 * @param token Some auth token
 * @param id some identifier
 * @returns Promise
 *
 * @see https://tanstack.com/query/v3/docs/react/overview
 */

export function getPosts(id: string) {
	return axios
		.get(process.env.VITE_BACKEND_API_URL + "/posts/" + id, {
			headers: {
				"Content-Type": "application/json",
			},
		})
		.then((res) => {
			return res.data;
		});
}
