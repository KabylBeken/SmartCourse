import AppRouter from '@/app/router/AppRouter';
import Providers from '@/app/providers';

function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}

export default App;
