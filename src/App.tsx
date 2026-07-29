import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import SituationQuiz from './features/situation/SituationQuiz'
import StoryQuiz from './features/story/StoryQuiz'
import ConversationQuiz from './features/conversation/ConversationQuiz'
import CrosswordPuzzle from './features/crossword/CrosswordPuzzle'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/situation" element={<SituationQuiz />} />
        <Route path="/story" element={<StoryQuiz />} />
        <Route path="/conversation" element={<ConversationQuiz />} />
        <Route path="/crossword" element={<CrosswordPuzzle />} />
      </Routes>
    </HashRouter>
  )
}

export default App
