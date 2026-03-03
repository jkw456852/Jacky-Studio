import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Workspace from './pages/Workspace';
import WorkspaceNew from './pages/Workspace/WorkspaceNew';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import VideoWorkspace from './pages/VideoWorkspace';

const App: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Routes>
          <Route path="/" element={<Home onExit={onExit} />} />
          <Route path="/projects" element={<Projects onExit={onExit} />} />
          <Route path="/workspace/:id" element={<Workspace />} />
          <Route path="/video-workspace" element={<VideoWorkspace />} />
          {/* 新版Workspace - 使用Store和组件化架构 */}
          <Route path="/workspace-new/:id" element={<WorkspaceNew />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
