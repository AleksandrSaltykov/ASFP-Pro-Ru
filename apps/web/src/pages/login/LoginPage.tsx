import { FormEvent, useState } from 'react';
import { useAppDispatch } from '@app/hooks';
import { signedIn } from '@shared/api/auth-slice';

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(
      signedIn({
        email,
        name: 'Demo User',
        roles: ['admin']
      })
    );
  };

  return (
    <section style={{ maxWidth: 360, margin: '48px auto' }}>
      <h1>Авторизация</h1>
      <p>Используйте корпоративный аккаунт для входа в систему.</p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit">Войти</button>
      </form>
    </section>
  );
};

export default LoginPage;
