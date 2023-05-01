import axios from "axios";
import { ResponseType } from "types/api";

// some method
export function createSomething(
	token: string,
	title: string,
): Promise<ResponseType> {
	return axios
		.post(
			"https://domain.com/some/endpoint",
			JSON.stringify({ title: title }),
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: token,
				},
			}
		)
		.then(function (response) {
			return {
				success: true,
				res: response.data,
			};
		})
		.catch(function (error) {
			return {
				success: false,
				res:
					error.response && error.response.data
						? error.response.data
						: error.response?.statusText || "Unable to reach server.",
			};
		});
}
