import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import SituationQuiz from './features/situation/SituationQuiz'
import StoryQuiz from './features/story/StoryQuiz'
import ConversationQuiz from './features/conversation/ConversationQuiz'
import CrosswordPuzzle from './features/crossword/CrosswordPuzzle'
import RequireAdmin from './components/RequireAdmin'
import AdminLogin from './pages/Admin/AdminLogin'
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
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminHome />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/situations"
          element={
            <RequireAdmin>
              <SituationAdmin />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/stories"
          element={
            <RequireAdmin>
              <StoryAdmin />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/conversations"
          element={
            <RequireAdmin>
              <ConversationAdmin />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/crossword"
          element={
            <RequireAdmin>
              <CrosswordAdmin />
            </RequireAdmin>
          }
        />
      </Routes>
    </HashRouter>
  )
}

export default App
