import Router from "next/router";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "../services/apiClient";
import { setCookie, parseCookies, destroyCookie } from 'nookies'

type SignInCredentials = {
    email: string;
    password: string;
}
type User = {
    email: string;
    permissions: string[];
    roles: string[];
}
type AuthContextProps = {
    signIn(credentials: SignInCredentials): Promise<void>;
    isAuthenticated: boolean;
    signOut(): void;
    user: User;
}
type AuthProviderProps = {
    children: ReactNode
}

const AuthContext = createContext({} as AuthContextProps);

let authChannel: BroadcastChannel

export function signOut() {
    destroyCookie(undefined, 'nextauth.token');
    destroyCookie(undefined, 'nextauth.refreshToken');

    authChannel.postMessage('logout');
    Router.replace('/');
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>()
    const isAuthenticated = !!user;

    useEffect(() => {
        if (process.browser) {
            authChannel = new BroadcastChannel('auth');
            authChannel.onmessage = (message) => {
                switch (message.data) {
                    case 'logout':
                        signOut()
                        break;
                    default:
                        break;
                }
            }
        }
    })
    useEffect(() => {
        const { 'nextauth.token': token } = parseCookies()

        if (token) {
            api.get('/me').then(response => {
                const { email, permissions, roles } = response.data;

                setUser({ email, permissions, roles })

            }).catch(() => {
                signOut()
            })
        }

    }, [])



    async function signIn({ email, password }: SignInCredentials) {
        try {
            const response = await api.post('/sessions', { email, password })

            const { token, refreshToken, roles, permissions } = response.data;

            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            })

            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            })


            setUser({
                email,
                roles,
                permissions
            })

            api.defaults.headers['Authorization'] = `Bearer ${token}`

            Router.push('/dashboard')

        } catch (e) {
            console.log(e)
        }
    }

    return (
        <AuthContext.Provider value={{ user, signIn, signOut, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = (): AuthContextProps => useContext(AuthContext)



