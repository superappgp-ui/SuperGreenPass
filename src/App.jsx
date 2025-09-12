// src/App.jsx 
import { Routes, Route, Link } from 'react-router-dom'; 
import Layout from '@/pages/Layout.jsx';
import Home from '@/pages/Home'; 
import Welcome from '@/pages/Welcome.jsx';
import Schools from './pages/Schools';
import ProgramsPage from './pages/Programs';


export default function App() { 
  return ( 
  <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/schools" element={<Schools />} />
        <Route path="/programs" element={<ProgramsPage />} />
        {/* add more routes here */}
      </Routes>
    </Layout>
  ); 
}