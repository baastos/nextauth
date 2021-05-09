import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'
import { signOut } from '../hooks/useAuth';
import { AuthTokenError } from './errors/AuthTokenError';

let isRefreshing = false;
let failedRequestsqueue = []

export function setupAPIClient(ctx = undefined) {

    let cookies = parseCookies(ctx);

    const api = axios.create({
        baseURL: 'http://localhost:3333',
        headers: {
            Authorization: `Bearer ${cookies['nextauth.token']}`
        }
    })

    api.interceptors.response.use(response => {
        return response
    }, (error: AxiosError) => {
        if (error.response.status === 401) {
            if (error.response.data?.code === 'token.expired') {
                cookies = parseCookies(ctx);

                const { 'nextauth.refreshToken': refreshToken } = cookies;

                const originalConfig = error.config;

                if (!isRefreshing) {

                    isRefreshing = true;

                    api.post('/refresh', {
                        refreshToken
                    }).then(response => {
                        const { token } = response.data

                        setCookie(ctx, 'nextauth.token', token, {
                            maxAge: 60 * 60 * 24 * 30, // 30 days
                            path: '/'
                        })

                        setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
                            maxAge: 60 * 60 * 24 * 30, // 30 days
                            path: '/'
                        })

                        api.defaults.headers['Authorization'] = `Bearer ${token}`

                        failedRequestsqueue.forEach(request => request.onSuccess(token));

                        failedRequestsqueue = []

                    }).catch(err => {
                        failedRequestsqueue.forEach(request => request.onFailure(err));

                        failedRequestsqueue = []

                        if (process.browser) {
                            signOut();

                        }

                    }).finally(() => {
                        isRefreshing = false;
                    })
                }
                return new Promise((resolve, reject) => {
                    failedRequestsqueue.push({
                        onSuccess: (token: string) => {
                            originalConfig.headers['Authorization'] = `Bearer ${token}`
                            resolve(api(originalConfig))
                        },
                        onFailure: (error: AxiosError) => {
                            reject(error)
                        }
                    })
                })
            } else {
                if (process.browser) {
                    signOut();

                } else {
                    return Promise.reject(new AuthTokenError())
                }
            }
        }
        return Promise.reject(error)
    })
    return api;
}