import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ScrollToTop } from '../components/layout/ScrollToTop'
import { AuthProvider } from '../hooks/useAuth'
import { AuthPage } from '../pages/AuthPage'
import { DailyChallengePage } from '../pages/DailyChallengePage'
import { GamePage } from '../pages/GamePage'
import { HomePage } from '../pages/HomePage'
import { LeaderboardPage } from '../pages/LeaderboardPage'
import { OnlinePage } from '../pages/OnlinePage'
import { OnlineRoomPage } from '../pages/OnlineRoomPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { ProPage } from '../pages/ProPage'
import { ProfilePage } from '../pages/ProfilePage'
import { TournamentRoomPage } from '../pages/TournamentRoomPage'
import { TournamentsPage } from '../pages/TournamentsPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/online" element={<OnlinePage />} />
            <Route path="/online/:roomCode" element={<OnlineRoomPage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/tournaments/:tournamentCode" element={<TournamentRoomPage />} />
            <Route path="/daily" element={<DailyChallengePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/pro" element={<ProPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/auth" element={<AuthPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
