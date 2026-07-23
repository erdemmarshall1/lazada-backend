const https = require('https')

const API = 'https://lazada-backend-production-3b57.up.railway.app'
const USERNAME = 'admin_wholesale'
const PASSWORD = 'Admin@MQQYYI6G'
const CONCURRENCY = 15

const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const u = new URL(url)
  const body = JSON.stringify(data)
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname, method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'User-Agent': 'script/1.0',
      token: token || '',
      Authorization: token ? `Bearer ${token}` : '',
      'x-access-token': token || '',
    },
    timeout: 30000,
  }
  const req = https.request(opts, (res) => {
    let d = ''
    res.on('data', (c) => d += c)
    res.on('end', () => { try { resolve(JSON.parse(d)) } catch (e) { reject(new Error(d.slice(0, 200))) } })
  })
  req.on('error', reject)
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
  req.write(body)
  req.end()
})

const getJSON = (url, token) => new Promise((resolve, reject) => {
  const u = new URL(url)
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'GET',
    headers: {
      'User-Agent': 'script/1.0',
      token: token || '',
      Authorization: token ? `Bearer ${token}` : '',
      'x-access-token': token || '',
    },
    timeout: 30000,
  }
  const req = https.request(opts, (res) => {
    let d = ''
    res.on('data', (c) => d += c)
    res.on('end', () => { try { resolve(JSON.parse(d)) } catch (e) { reject(new Error(d.slice(0, 200))) } })
  })
  req.on('error', reject)
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
  req.end()
})

const pMap = async (items, fn, concurrency) => {
  const results = []
  let i = 0
  const next = async () => {
    if (i >= items.length) return
    const idx = i++
    try { results[idx] = await fn(items[idx], idx) } catch (e) { results[idx] = e }
    await next()
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next))
  return results
}

const main = async () => {
  console.log('Logging in as admin...')
  const loginRes = await postJSON(`${API}/main/sendMsg/login`, {
    username: USERNAME, password: PASSWORD,
  })
  if (loginRes.code !== 0) {
    console.error('Login failed:', loginRes.msg || JSON.stringify(loginRes))
    process.exit(1)
  }
  const token = loginRes.data?.token || loginRes.token
  console.log('Login OK')

  console.log('Fetching all products (paginated)...')
  const all = []
  let page = 1
  while (true) {
    const res = await getJSON(`${API}/main/goods/getSearchList?pageSize=100&page=${page}`, token)
    const list = res.data?.list || []
    if (list.length === 0) break
    for (const p of list) {
      if (!all.some(e => e._id === p._id)) all.push(p)
    }
    page++
    if (page % 50 === 0) console.log(`  Page ${page} (total unique: ${all.length})`)
  }
  console.log(`Total unique products fetched: ${all.length}`)

  const groups = {}
  for (const p of all) {
    const key = (p.name || '').trim().toLowerCase()
    if (!key) continue
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  }

  const duplicateEntries = Object.entries(groups).filter(([, prods]) => prods.length > 1)
  console.log(`Duplicate groups found: ${duplicateEntries.length}`)

  let totalDeleted = 0
  let totalToDelete = 0
  for (const [, prods] of duplicateEntries) {
    totalToDelete += prods.length - 1
  }
  console.log(`Total duplicates to delete: ${totalToDelete}`)
  console.log('')

  for (let gi = 0; gi < duplicateEntries.length; gi++) {
    const [name, products] = duplicateEntries[gi]

    products.sort((a, b) => {
      const diff = (b.salesCount || 0) - (a.salesCount || 0)
      if (diff !== 0) return diff
      return (b.rating || 0) - (a.rating || 0)
    })

    const keep = products[0]
    const toDelete = products.slice(1)

    process.stdout.write(`[${gi + 1}/${duplicateEntries.length}] keeping ${keep._id}, deleting ${toDelete.length} dups... `)

    const results = await pMap(toDelete, async (d) => {
      const res = await postJSON(`${API}/home/admin/delete-product`, { productId: d._id }, token)
      return res.code === 0 ? 1 : 0
    }, CONCURRENCY)

    const ok = results.filter(r => r === 1).length
    totalDeleted += ok
    process.stdout.write(`${ok} OK, ${results.length - ok} FAIL\n`)
  }

  console.log(`\n========================`)
  console.log(`Duplicate groups found: ${duplicateEntries.length}`)
  console.log(`Products deleted:       ${totalDeleted}`)
  console.log(`========================`)
}

main().catch(err => { console.error('FATAL:', err); process.exit(1) })
