import { useState, useEffect } from "react"
import { LandingPage } from "./components/LandingPage"
import { AuthModal } from "./components/AuthModal"
import { Dashboard } from "./components/Dashboard"
import { createClient } from "@supabase/supabase-js"
import { projectId, publicAnonKey } from "./utils/supabase/info"

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [username, setUsername] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient(
          `https://${projectId}.supabase.co`,
          publicAnonKey,
        )
        
        const { data } = await supabase.auth.getSession()
        
        if (data.session) {
          setAccessToken(data.session.access_token)
          setUsername(data.session.user.user_metadata?.username || '사용자')
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('세션 확인 중 에러:', error)
      }
    }

    checkSession()
  }, [])

  const handleLogin = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  const handleSignup = () => {
    setAuthMode('signup')
    setShowAuthModal(true)
  }

  const handleAuthSuccess = (token: string, name: string) => {
    setAccessToken(token)
    setUsername(name)
    setIsAuthenticated(true)
    setShowAuthModal(false)
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey,
      )
      
      await supabase.auth.signOut()
      setIsAuthenticated(false)
      setAccessToken('')
      setUsername('')
    } catch (error) {
      console.error('로그아웃 중 에러:', error)
    }
  }

  return (
    <>
      {isAuthenticated ? (
        <Dashboard
          username={username}
          accessToken={accessToken}
          onLogout={handleLogout}
        />
      ) : (
        <LandingPage onLogin={handleLogin} onSignup={handleSignup} />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}