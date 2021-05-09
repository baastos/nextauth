import { useEffect } from "react"
import { signOut } from "../hooks/useAuth"
import { api } from "../services/apiClient"
import { setupAPIClient } from "../services/api"
import { withSSRAuth } from "../utils/withSSRAuth"
import { Can } from "../components/Can"

export default function Dashboard() {

    useEffect(() => {
        api.get('/me').then(response => console.log(response.data)).catch(() => signOut())
    }, [])
    return (
        <>
            <h1>Dashboard</h1>
            <Can permissions={['metrics.list']}>
                <div>METRICS</div>
            </Can>
            <button onClick={signOut}>Sair</button>
        </>
    )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {

    const apiClient = setupAPIClient(ctx);
    const response = await apiClient.get('/me');

    return {
        props: {

        }
    }
})