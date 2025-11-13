import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Alert, AlertDescription } from "./ui/alert"
import { createClient } from "@supabase/supabase-js"
import { projectId, publicAnonKey } from "../utils/supabase/info"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'login' | 'signup'
  onSuccess: (accessToken: string, username: string) => void
}

export function AuthModal({ isOpen, onClose, mode, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // 로그인
        const supabase = createClient(
          `https://${projectId}.supabase.co`,
          publicAnonKey,
        )
        
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError('아이디 또는 비밀번호가 올바르지 않습니다.')
          setLoading(false)
          return
        }

        if (data.session) {
          const userUsername = data.user.user_metadata?.username || '사용자'
          onSuccess(data.session.access_token, userUsername)
          onClose()
        }
      } else {
        // 회원가입
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-a4cecb5c/signup`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ username, email, password }),
          }
        )

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || '회원가입에 실패했습니다.')
          setLoading(false)
          return
        }

        // 회원가입 후 자동 로그인
        const supabase = createClient(
          `https://${projectId}.supabase.co`,
          publicAnonKey,
        )
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError || !signInData.session) {
          setError('회원가입은 완료되었으나 로그인에 실패했습니다. 다시 로그인해주세요.')
          setLoading(false)
          return
        }

        onSuccess(signInData.session.access_token, username)
        onClose()
      }
    } catch (err) {
      console.error('인증 처리 중 에러:', err)
      setError('처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isLogin ? '로그인' : '회원가입'}</DialogTitle>
          <DialogDescription>
            {isLogin ? '리뷰 메이트에 로그인하세요' : '리뷰 메이트에 가입하세요'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username">사용자명</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="홍길동"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">아이디 (이메일)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:underline"
            >
              {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}