import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components';
import { Home, ProjectDetail, CreateProject } from './pages';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/create-project" element={<CreateProject />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
