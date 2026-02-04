import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage, DebatePage, ReplayPage } from './pages';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/debate/:id" element={<DebatePage />} />
        <Route path="/replay/:id" element={<ReplayPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
