import axios, { AxiosRequestConfig, Method } from "axios";

const ACCESS_TOKEN_KEY = "__at";
const MAX_RETRY_COUNT = 5;

const spotifyTokenRequestInstance = axios.create({
  baseURL: "https://accounts.spotify.com/api",
  timeout: 5000,
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});

const spotifyRequestInstance = axios.create({
  baseURL: "https://api.spotify.com",
  timeout: 5000,
});

export const getAccessToken = async () => {
  let success = false;
  await spotifyTokenRequestInstance
    .post("/token", {
      grant_type: "client_credentials",
      client_id: "36cb4845e2704350b7f9ea807927d159",
      // FUCK YEAH IM COMMITTING THIS
      client_secret: "50b0c3f09c5d42e79037fc33657a3511",
    })
    .then((response) => {
      if (response.status === 200) {
        if (response.data?.access_token) {
          sessionStorage.setItem(ACCESS_TOKEN_KEY, response.data.access_token);
          success = true;
        } else {
          throw Error("Access token not found");
        }
      }
    })
    .catch((reason) => {
      console.error(reason);
    });
  return success;
};

export const request = async (
  url: string,
  config: { method: Method } & AxiosRequestConfig,
  options: { retryCount?: number } = { retryCount: 0 }
): Promise<any> => {
  const { retryCount } = options ?? {};

  let accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);

  if (!accessToken) {
    const success = await getAccessToken();
    if (!success) {
      const retries = retryCount ?? 1;
      if (retries >= MAX_RETRY_COUNT) return;
      return request(url, config, { ...options, retryCount: retries + 1 });
    }
    return request(url, config, { ...options, retryCount: 0 });
  }

  const headersObject = {
    Authorization: `Bearer ${accessToken}`,
  };

  let result;
  await spotifyRequestInstance
    .request({
      url,
      ...config,
      headers: headersObject,
    })
    .then((response) => (result = response))
    .catch((error) => {
      if (error.response.status === 401) {
        // invalidate and retry
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        return request(url, config, options);
      }
    });
  return result;
};
