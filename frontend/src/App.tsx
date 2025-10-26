import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home, ProjectDetail, CreateProject } from './pages';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/create-project" element={<CreateProject />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
