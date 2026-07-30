import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import SituationQuiz from './features/situation/SituationQuiz'
import StoryQuiz from './features/story/StoryQuiz'
import ConversationQuiz from './features/conversation/ConversationQuiz'
import CrosswordPuzzle from './features/crossword/CrosswordPuzzle'
import AdminHome from './pages/Admin/AdminHome'
import SituationAdmin from './pages/Admin/SituationAdmin'
import StoryAdmin from './pages/Admin/StoryAdmin'
import ConversationAdmin from './pages/Admin/ConversationAdmin'
import CrosswordAdmin from './pages/Admin/CrosswordAdmin'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/situation" element={<SituationQuiz />} />
        <Route path="/story" element={<StoryQuiz />} />
        <Route path="/conversation" element={<ConversationQuiz />} />
        <Route path="/crossword" element={<CrosswordPuzzle />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/situations" element={<SituationAdmin />} />
        <Route path="/admin/stories" element={<StoryAdmin />} />
        <Route path="/admin/conversations" element={<ConversationAdmin />} />
        <Route path="/admin/crossword" element={<CrosswordAdmin />} />
      </Routes>
    </HashRouter>
  )
}

export default App
