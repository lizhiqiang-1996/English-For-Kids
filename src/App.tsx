import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AudioList from './pages/AudioList'
import AudioPlayer from './pages/AudioPlayer'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-wechat-light">
        <Routes>
          <Route path="/" element={<AudioList />} />
          <Route path="/player" element={<AudioPlayer />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App