import { FormEvent, useState } from 'react'
import { useAuth } from '../hooks/useAuth';
import styles from '../styles/Home.module.css'
import { withSSRGuest } from '../utils/withSSRGuest';

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('');

  const { signIn } = useAuth()

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const data = {
      email,
      password
    }
    signIn(data)

  }

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input
        placeholder="E-mail"
        type="email"
        name="email"
        value={email}
        onChange={e => setEmail(e.target.value)} />

      <input
        placeholder="Senha"
        type="password"
        name="password"
        value={password}
        onChange={e => setPassword(e.target.value)} />

      <input type="submit" title="Enviar" />
    </form>
  )
}

export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {
    }
  }
})