import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/index.js';
import './styles/tokens.css';
import './styles/app.css';

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
