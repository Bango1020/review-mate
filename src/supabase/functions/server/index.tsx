import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

// 회원가입 route
app.post('/make-server-a4cecb5c/signup', async (c) => {
  try {
    const { username, email, password } = await c.req.json()

    if (!username || !email || !password) {
      return c.json({ error: '모든 필드를 입력해주세요.' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 사용자 생성
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      // 이메일 서버가 설정되지 않았으므로 자동으로 이메일 확인
      email_confirm: true
    })

    if (error) {
      console.log('회원가입 중 에러:', error)
      return c.json({ error: error.message }, 400)
    }

    return c.json({ success: true, user: data.user })
  } catch (error) {
    console.log('회원가입 처리 중 에러:', error)
    return c.json({ error: '회원가입에 실패했습니다.' }, 500)
  }
})

// 가게 신청 route
app.post('/make-server-a4cecb5c/stores', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: '인증이 필요합니다.' }, 401)
    }

    const { businessName, storeName, platforms } = await c.req.json()

    if (!businessName || !storeName) {
      return c.json({ error: '모든 필드를 입력해주세요.' }, 400)
    }

    if (!platforms || Object.keys(platforms).length === 0) {
      return c.json({ error: '최소 하나의 배달 플랫폼을 선택해주세요.' }, 400)
    }

    // 가게 정보 저장
    const storeId = crypto.randomUUID()
    const storeData = {
      id: storeId,
      userId: user.id,
      businessName,
      storeName,
      platforms,
      createdAt: new Date().toISOString()
    }

    await kv.set(`store:${storeId}`, storeData)
    
    // 사용자별 가게 목록에 추가
    const userStoresKey = `user:${user.id}:stores`
    const existingStores = await kv.get(userStoresKey) || []
    existingStores.push(storeId)
    await kv.set(userStoresKey, existingStores)

    return c.json({ success: true, store: storeData })
  } catch (error) {
    console.log('가게 신청 처리 중 에러:', error)
    return c.json({ error: '가게 신청에 실패했습니다.' }, 500)
  }
})

// 사용자의 가게 목록 조회
app.get('/make-server-a4cecb5c/stores', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: '인증이 필요합니다.' }, 401)
    }

    const userStoresKey = `user:${user.id}:stores`
    const storeIds = await kv.get(userStoresKey) || []
    
    const stores = []
    for (const storeId of storeIds) {
      const store = await kv.get(`store:${storeId}`)
      if (store) {
        stores.push(store)
      }
    }

    return c.json({ stores })
  } catch (error) {
    console.log('가게 목록 조회 중 에러:', error)
    return c.json({ error: '가게 목록 조회에 실패했습니다.' }, 500)
  }
})

// 가게 삭제
app.delete('/make-server-a4cecb5c/stores/:storeId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: '인증이 필요합니다.' }, 401)
    }

    const storeId = c.req.param('storeId')
    const store = await kv.get(`store:${storeId}`)

    if (!store) {
      return c.json({ error: '가게를 찾을 수 없습니다.' }, 404)
    }

    if (store.userId !== user.id) {
      return c.json({ error: '권한이 없습니다.' }, 403)
    }

    // 가게 정보 삭제
    await kv.del(`store:${storeId}`)
    
    // 사용자 가게 목록에서 제거
    const userStoresKey = `user:${user.id}:stores`
    const storeIds = await kv.get(userStoresKey) || []
    const updatedStoreIds = storeIds.filter(id => id !== storeId)
    await kv.set(userStoresKey, updatedStoreIds)

    return c.json({ success: true })
  } catch (error) {
    console.log('가게 삭제 중 에러:', error)
    return c.json({ error: '가게 삭제에 실패했습니다.' }, 500)
  }
})

Deno.serve(app.fetch)