import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { MessageSquare, LogOut, Store, Plus, Trash2 } from "lucide-react"
import { StoreForm } from "./StoreForm"
import { Alert, AlertDescription } from "./ui/alert"

interface DashboardProps {
  username: string
  accessToken: string
  onLogout: () => void
}

interface Store {
  id: string
  businessName: string
  storeName: string
  platforms: Record<string, { id: string; password: string }>
  createdAt: string
}

export function Dashboard({ username, accessToken, onLogout }: DashboardProps) {
  const [showStoreForm, setShowStoreForm] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStores = async () => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info')
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a4cecb5c/stores`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '가게 목록을 불러오는데 실패했습니다.')
      }

      setStores(data.stores || [])
    } catch (err) {
      console.error('가게 목록 조회 중 에러:', err)
      setError('가게 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStores()
  }, [accessToken])

  const handleStoreAdded = () => {
    setShowStoreForm(false)
    fetchStores()
  }

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('정말 이 가게를 삭제하시겠습니까?')) {
      return
    }

    try {
      const { projectId } = await import('../utils/supabase/info')
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a4cecb5c/stores/${storeId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '가게 삭제에 실패했습니다.')
      }

      fetchStores()
    } catch (err) {
      console.error('가게 삭제 중 에러:', err)
      alert('가게 삭제에 실패했습니다.')
    }
  }

  const platformNames: Record<string, string> = {
    baemin: '배달의민족',
    yogiyo: '요기요',
    coupang: '쿠팡이츠',
    ddangyo: '땡겨요',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-8 text-blue-600" />
            <h1 className="text-blue-600">리뷰 메이트</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{username}님</span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="size-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="mb-2">대시보드</h2>
          <p className="text-gray-600">등록된 가게를 관리하고 리뷰 답변을 확인하세요</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Store Form */}
        {showStoreForm && (
          <div className="mb-6">
            <StoreForm
              accessToken={accessToken}
              onSuccess={handleStoreAdded}
              onCancel={() => setShowStoreForm(false)}
            />
          </div>
        )}

        {/* Add Store Button */}
        {!showStoreForm && (
          <Button onClick={() => setShowStoreForm(true)} className="mb-6">
            <Plus className="size-4 mr-2" />
            가게 신청
          </Button>
        )}

        {/* Stores Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : stores.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="size-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                아직 등록된 가게가 없습니다
              </p>
              <p className="text-gray-500">
                가게를 신청하여 리뷰 답변 자동화 서비스를 시작하세요
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Card key={store.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle>{store.storeName}</CardTitle>
                      <CardDescription>{store.businessName}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStore(store.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Store className="size-4" />
                      <span>활성화됨</span>
                    </div>
                    
                    {/* 연동된 플랫폼 표시 */}
                    <div className="space-y-2">
                      <p className="text-gray-700">연동 플랫폼:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(store.platforms || {}).map((platform) => (
                          <span
                            key={platform}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {platformNames[platform] || platform}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-gray-500 pt-2 border-t">
                      등록일: {new Date(store.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}