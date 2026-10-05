import { useState } from 'react';
import LoginScreen from './components/LoginScreen.jsx';
import Portal from './components/Portal.jsx';

export default function App() {
  const [user, setUser] = useState(null); // { name, email } once signed in

  // The portal only exists while signed in, so logging out discards its state and the next login starts fresh.
  return user
    ? <Portal user={user} onLogout={() => setUser(null)} />
    : <LoginScreen onLogin={setUser} />;
}
