import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Alert, AlertDescription } from "./ui/alert"
import { Checkbox } from "./ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog"

interface StoreFormProps {
  accessToken: string
  onSuccess: () => void
  onCancel: () => void
}

interface PlatformCredentials {
  id: string
  password: string
}

interface SelectedPlatforms {
  baemin: boolean
  yogiyo: boolean
  coupang: boolean
  ddangyo: boolean
}

interface PlatformCredentialsMap {
  baemin: PlatformCredentials
  yogiyo: PlatformCredentials
  coupang: PlatformCredentials
  ddangyo: PlatformCredentials
}

export function StoreForm({ accessToken, onSuccess, onCancel }: StoreFormProps) {
  const [businessName, setBusinessName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<SelectedPlatforms>({
    baemin: false,
    yogiyo: false,
    coupang: false,
    ddangyo: false,
  })
  const [credentials, setCredentials] = useState<PlatformCredentialsMap>({
    baemin: { id: '', password: '' },
    yogiyo: { id: '', password: '' },
    coupang: { id: '', password: '' },
    ddangyo: { id: '', password: '' },
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const platformNames = {
    baemin: '배달의민족',
    yogiyo: '요기요',
    coupang: '쿠팡이츠',
    ddangyo: '땡겨요',
  }

  const handlePlatformToggle = (platform: keyof SelectedPlatforms) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }))
    
    // 플랫폼을 해제하면 해당 플랫폼의 인증 정보도 초기화
    if (selectedPlatforms[platform]) {
      setCredentials(prev => ({
        ...prev,
        [platform]: { id: '', password: '' }
      }))
    }
  }

  const handleCredentialChange = (
    platform: keyof PlatformCredentialsMap,
    field: 'id' | 'password',
    value: string
  ) => {
    setCredentials(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }))
  }

  const validateForm = () => {
    if (!businessName || !storeName) {
      setError('사업자명과 가게명을 입력해주세요.')
      return false
    }

    const hasSelectedPlatform = Object.values(selectedPlatforms).some(selected => selected)
    if (!hasSelectedPlatform) {
      setError('최소 하나의 배달 플랫폼을 선택해주세요.')
      return false
    }

    // 선택된 플랫폼의 ID/PW가 모두 입력되었는지 확인
    for (const [platform, isSelected] of Object.entries(selectedPlatforms)) {
      if (isSelected) {
        const cred = credentials[platform as keyof PlatformCredentialsMap]
        if (!cred.id || !cred.password) {
          setError(`${platformNames[platform as keyof typeof platformNames]}의 ID와 비밀번호를 입력해주세요.`)
          return false
        }
      }
    }

    return true
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) {
      return
    }

    setShowConfirmDialog(true)
  }

  const handleConfirmedSubmit = async () => {
    setShowConfirmDialog(false)
    setLoading(true)

    try {
      // 선택된 플랫폼의 인증 정보만 추출
      const platformData = Object.entries(selectedPlatforms)
        .filter(([_, isSelected]) => isSelected)
        .reduce((acc, [platform]) => {
          acc[platform] = credentials[platform as keyof PlatformCredentialsMap]
          return acc
        }, {} as Record<string, PlatformCredentials>)

      const { projectId } = await import('../utils/supabase/info')
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a4cecb5c/stores`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ 
            businessName, 
            storeName,
            platforms: platformData
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '가게 신청에 실패했습니다.')
        setLoading(false)
        return
      }

      setBusinessName('')
      setStoreName('')
      setSelectedPlatforms({
        baemin: false,
        yogiyo: false,
        coupang: false,
        ddangyo: false,
      })
      setCredentials({
        baemin: { id: '', password: '' },
        yogiyo: { id: '', password: '' },
        coupang: { id: '', password: '' },
        ddangyo: { id: '', password: '' },
      })
      onSuccess()
    } catch (err) {
      console.error('가게 신청 중 에러:', err)
      setError('가게 신청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>새 가게 신청</CardTitle>
          <CardDescription>가게 정보를 입력하여 리뷰 답변 자동화 서비스를 시작하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">사업자명</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="예: (주)맛있는치킨"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeName">가게명</Label>
                <Input
                  id="storeName"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="예: 맛있는치킨 강남점"
                  required
                />
              </div>
            </div>

            {/* 배달 플랫폼 선택 */}
            <div className="space-y-3">
              <Label>배달 플랫폼 선택</Label>
              <div className="space-y-3">
                {(Object.keys(platformNames) as Array<keyof typeof platformNames>).map((platform) => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform}
                      checked={selectedPlatforms[platform]}
                      onCheckedChange={() => handlePlatformToggle(platform)}
                    />
                    <label
                      htmlFor={platform}
                      className="cursor-pointer select-none"
                    >
                      {platformNames[platform]}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* 선택된 플랫폼의 인증 정보 입력 */}
            {Object.entries(selectedPlatforms).some(([_, isSelected]) => isSelected) && (
              <div className="space-y-4 pt-4 border-t">
                <Label>플랫폼 계정 정보</Label>
                {(Object.entries(selectedPlatforms) as [keyof SelectedPlatforms, boolean][]).map(([platform, isSelected]) => 
                  isSelected && (
                    <div key={platform} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-gray-700">{platformNames[platform]}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`${platform}-id`}>ID</Label>
                          <Input
                            id={`${platform}-id`}
                            type="text"
                            value={credentials[platform].id}
                            onChange={(e) => handleCredentialChange(platform, 'id', e.target.value)}
                            placeholder="아이디 입력"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${platform}-password`}>비밀번호</Label>
                          <Input
                            id={`${platform}-password`}
                            type="password"
                            value={credentials[platform].password}
                            onChange={(e) => handleCredentialChange(platform, 'password', e.target.value)}
                            placeholder="비밀번호 입력"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? '처리 중...' : '가게 신청'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 확인 팝업 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>가게 신청 확인</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>다음 정보로 가게를 신청하시겠습니까?</p>
              <div className="mt-4 space-y-2 text-gray-900">
                <p><strong>사업자명:</strong> {businessName}</p>
                <p><strong>가게명:</strong> {storeName}</p>
                <p><strong>연동 플랫폼:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  {(Object.entries(selectedPlatforms) as [keyof SelectedPlatforms, boolean][]).map(([platform, isSelected]) => 
                    isSelected && (
                      <li key={platform}>
                        {platformNames[platform]} (ID: {credentials[platform].id})
                      </li>
                    )
                  )}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSubmit}>
              신청하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}