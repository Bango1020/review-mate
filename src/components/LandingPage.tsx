import { Button } from "./ui/button"
import { MessageSquare, Zap, Clock, TrendingUp } from "lucide-react"

interface LandingPageProps {
  onLogin: () => void
  onSignup: () => void
}

export function LandingPage({ onLogin, onSignup }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-8 text-blue-600" />
          <h1 className="text-blue-600">리뷰 메이트</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onLogin}>
            로그인
          </Button>
          <Button onClick={onSignup}>
            회원가입
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-blue-600 mb-4">배달 리뷰 답변, 이제는 자동으로</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          AI가 고객 리뷰를 분석하고 적절한 답변을 자동으로 작성해드립니다.
          <br />
          가게 운영에만 집중하세요.
        </p>
        <Button size="lg" onClick={onSignup} className="px-8">
          무료로 시작하기
        </Button>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <div className="inline-flex items-center justify-center size-12 bg-blue-100 rounded-full mb-4">
              <Zap className="size-6 text-blue-600" />
            </div>
            <h3 className="mb-2">빠른 답변</h3>
            <p className="text-gray-600">
              리뷰가 등록되면 즉시 AI가 적절한 답변을 생성합니다.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <div className="inline-flex items-center justify-center size-12 bg-blue-100 rounded-full mb-4">
              <Clock className="size-6 text-blue-600" />
            </div>
            <h3 className="mb-2">시간 절약</h3>
            <p className="text-gray-600">
              하루에 수십 개의 리뷰에 답변하는 시간을 절약하세요.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <div className="inline-flex items-center justify-center size-12 bg-blue-100 rounded-full mb-4">
              <TrendingUp className="size-6 text-blue-600" />
            </div>
            <h3 className="mb-2">만족도 향상</h3>
            <p className="text-gray-600">
              신속하고 정성스러운 답변으로 고객 만족도를 높입니다.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="mb-4">지금 바로 시작하세요</h2>
          <p className="mb-8 opacity-90">
            간편한 가게 등록으로 바로 서비스를 이용할 수 있습니다.
          </p>
          <Button size="lg" variant="secondary" onClick={onSignup} className="px-8">
            무료 회원가입
          </Button>
        </div>
      </section>
    </div>
  )
}
