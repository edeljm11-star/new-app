import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import SituationQuiz from './features/situation/SituationQuiz'
import StoryQuiz from './features/story/StoryQuiz'
import ConversationQuiz from './features/conversation/ConversationQuiz'
import CrosswordPuzzle from './features/crossword/CrosswordPuzzle'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'
import AdminLogin from './pages/Admin/AdminLogin'
import AdminHome from './pages/Admin/AdminHome'
import SituationAdmin from './pages/Admin/SituationAdmin'
import StoryAdmin from './pages/Admin/StoryAdmin'
import ConversationAdmin from './pages/Admin/ConversationAdmin'
import CrosswordAdmin from './pages/Admin/CrosswordAdmin'
import UsersAdmin from './pages/Admin/UsersAdmin'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/situation/:openId?"
          element={
            <RequireAuth>
              <SituationQuiz />
            </RequireAuth>
          }
        />
        <Route
          path="/story/:storyId?"
          element={
            <RequireAuth>
              <StoryQuiz />
            </RequireAuth>
          }
        />
        <Route
          path="/conversation/:openId?"
          element={
            <RequireAuth>
              <ConversationQuiz />
            </RequireAuth>
          }
        />
        <Route
          path="/crossword/:puzzleId?"
          element={
            <RequireAuth>
              <CrosswordPuzzle />
            </RequireAuth>
          }
        />
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
        <Route
          path="/admin/users"
          element={
            <RequireAdmin>
              <UsersAdmin />
            </RequireAdmin>
          }
        />
      </Routes>
    </HashRouter>
  )
}

export default App
