const fs = require('fs')
const path = require('path')
const https = require('https')
const { execSync } = require('child_process')

const API = 'https://supportive-delight-production-b90c.up.railway.app'
const CLOUDINARY = {
  cloud_name: 'u7xxu5dq',
  api_key: '726627823236327',
  api_secret: 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
}
const ADMIN_USER = 'admin_wholesale'
const ADMIN_PASS = 'Admin@MQQYYI6G'

const ROOT = path.resolve(__dirname, '..')
const cloudinary = require(path.join(ROOT, 'backend', 'node_modules', 'cloudinary')).v2
const archiver = require(path.join(ROOT, 'backend', 'node_modules', 'archiver'))
const DATE = new Date().toISOString().slice(0, 10)
const BACKUP_DIR = path.join(ROOT, 'backups', `full_backup_${DATE}`)
const ZIP_PATH = path.join(ROOT, 'backups', `full_backup_${DATE}.zip`)

const request = (method, url, data, token) => new Promise((resolve, reject) => {
  const u = new URL(url)
  const body = data ? JSON.stringify(data) : null
  const opts = {
    hostname: u.hostname, port: u.port || 443,
    path: u.pathname + (method === 'GET' && !data ? u.search : ''),
    method,
    headers: { 'User-Agent': 'backup-script/1.0' },
    timeout: 60000,
  }
  if (body) {
    opts.headers['Content-Type'] = 'application/json'
    opts.headers['Content-Length'] = Buffer.byteLength(body)
  }
  if (token) {
    opts.headers['token'] = token
    opts.headers['Authorization'] = `Bearer ${token}`
  }
  const req = https.request(opts, (res) => {
    let d = ''
    res.on('data', (c) => d += c)
    res.on('end', () => {
      try { resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(d) }) }
      catch (e) { resolve({ status: res.statusCode, headers: res.headers, raw: d }) }
    })
  })
  req.on('error', reject)
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
  if (body) req.write(body)
  req.end()
})

const requestBuffer = (url, data, token) => new Promise((resolve, reject) => {
  const u = new URL(url)
  const body = data ? JSON.stringify(data) : null
  const opts = {
    hostname: u.hostname, port: u.port || 443,
    path: u.pathname + u.search, method: data ? 'POST' : 'GET',
    headers: { 'User-Agent': 'backup-script/1.0' },
    timeout: 120000,
  }
  if (body) {
    opts.headers['Content-Type'] = 'application/json'
    opts.headers['Content-Length'] = Buffer.byteLength(body)
  }
  if (token) {
    opts.headers['token'] = token
    opts.headers['Authorization'] = `Bearer ${token}`
  }
  const req = https.request(opts, (res) => {
    const chunks = []
    res.on('data', (c) => chunks.push(c))
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data: Buffer.concat(chunks) }))
  })
  req.on('error', reject)
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
  if (body) req.write(body)
  req.end()
})

function copyDir(src, dest, exclude = []) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue
    const s = path.join(src, entry.name), d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d, exclude)
    else fs.copyFileSync(s, d)
  }
}

function getDirSize(dir) {
  let size = 0
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name)
      if (entry.isDirectory()) size += getDirSize(p)
      else size += fs.statSync(p).size
    }
  } catch (e) {}
  return size
}

async function uploadToCloudinary(filePath, publicId) {
  cloudinary.config({
    cloud_name: CLOUDINARY.cloud_name,
    api_key: CLOUDINARY.api_key,
    api_secret: CLOUDINARY.api_secret,
  })
  return cloudinary.uploader.upload(filePath, {
    public_id: publicId,
    resource_type: 'raw',
    type: 'upload',
    use_filename: true,
    unique_filename: false,
    overwrite: true,
  })
}

async function main() {
  const start = Date.now()
  console.log('=== FULL BACKUP TO CLOUD ===')
  console.log(`Date: ${DATE}`)
  console.log(`Backup dir: ${BACKUP_DIR}`)
  console.log(`API: ${API}\n`)

  // Step 1: Login to Railway backend
  console.log('[1/5] Logging into Railway backend...')
  const loginRes = await request('POST', `${API}/main/sendMsg/login`, {
    username: ADMIN_USER,
    password: ADMIN_PASS,
  })
  const token = loginRes.data?.data?.token || loginRes.data?.token
  if (!token) {
    console.error('Login failed:', JSON.stringify(loginRes.data || loginRes.raw))
    process.exit(1)
  }
  console.log('  Login OK\n')

  // Step 2: Download backup zip from API (Method A)
  console.log('[2/5] Downloading full database backup from Railway...')
  const backupUrl = `${API}/home/admin/backup`
  let dbBackupOK = false
  try {
    const resp = await requestBuffer(backupUrl, {}, token)
    if (resp.status === 200 && resp.data.length > 1000) {
      fs.mkdirSync(path.dirname(ZIP_PATH), { recursive: true })
      fs.writeFileSync(ZIP_PATH, resp.data)
      const zipSizeMB = (resp.data.length / 1024 / 1024).toFixed(2)
      console.log(`  Downloaded: ${zipSizeMB} MB`)
      dbBackupOK = true
    } else {
      console.log(`  Backup API returned status ${resp.status}, size ${resp.data.length}b`)
      console.log('  Will try JSON dump method instead...')
      const dumpRes = await request('POST', `${API}/home/admin/backup/d`, {}, token)
      if (dumpRes.data?.success) {
        fs.mkdirSync(path.join(BACKUP_DIR, 'database'), { recursive: true })
        for (const [name, docs] of Object.entries(dumpRes.data.data)) {
          fs.writeFileSync(path.join(BACKUP_DIR, 'database', `${name}.json`), JSON.stringify(docs, null, 2))
        }
        console.log(`  Dumped ${Object.keys(dumpRes.data.data).length} collections as JSON`)
        dbBackupOK = true
      }
    }
  } catch (e) {
    console.log(`  Backup download failed: ${e.message}`)
  }
  if (!dbBackupOK) console.log('  WARNING: Database backup failed, proceeding with code/files only\n')
  else console.log('')

  // Step 3: Copy source code and uploads
  console.log('[3/5] Packaging source code and uploads...')
  const srcDir = path.join(BACKUP_DIR, 'source-code')
  copyDir(path.join(ROOT, 'backend'), path.join(srcDir, 'backend'), ['node_modules', '.git'])
  copyDir(path.join(ROOT, 'frontend'), path.join(srcDir, 'frontend'), ['node_modules', 'dist'])

  const configDir = path.join(BACKUP_DIR, 'config')
  fs.mkdirSync(configDir, { recursive: true })
  for (const f of ['.env', '.env.production', '.env.admin']) {
    const fp = path.join(ROOT, 'frontend', f)
    if (fs.existsSync(fp)) fs.copyFileSync(fp, path.join(configDir, `frontend_${f}`))
  }
  for (const f of ['.env']) {
    const fp = path.join(ROOT, 'backend', f)
    if (fs.existsSync(fp)) fs.copyFileSync(fp, path.join(configDir, `backend_${f}`))
  }

  const gitDir = path.join(BACKUP_DIR, 'git')
  fs.mkdirSync(gitDir, { recursive: true })
  try {
    const log = execSync('git log --oneline -5', { cwd: ROOT, encoding: 'utf8', timeout: 10000 })
    const remote = execSync('git remote -v', { cwd: ROOT, encoding: 'utf8', timeout: 10000 })
    fs.writeFileSync(path.join(gitDir, 'git-info.txt'), `Remote:\n${remote}\n\nRecent commits:\n${log}`)
  } catch (e) {
    fs.writeFileSync(path.join(gitDir, 'git-info.txt'), `Git info unavailable: ${e.message}`)
  }

  const uploadsDest = path.join(BACKUP_DIR, 'uploads')
  copyDir(path.join(ROOT, 'backend', 'uploads'), uploadsDest)

  const dataDir = path.join(BACKUP_DIR, 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  const dataFiles = [
    'products_with_images.json', 'extracted_products.json',
    'cdn_urls.json', 'all_products_names.txt', 'products_list.txt',
    'unique_products.txt', 'image_migration_log.json', 'product_match_log.json',
  ]
  for (const f of dataFiles) {
    const fp = path.join(ROOT, f)
    if (fs.existsSync(fp)) fs.copyFileSync(fp, path.join(dataDir, f))
  }

  // Write manifest
  const backupSize = getDirSize(BACKUP_DIR)
  const manifest = {
    date: new Date().toISOString(),
    source: 'The Outnet Wholesale - Full Backup',
    git_commit: execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8', timeout: 5000 }).trim(),
    api_url: API,
    contents_zip: `${ZIP_PATH} - all MongoDB collections + env`,
    contents_folder: BACKUP_DIR,
    folder_size_mb: (backupSize / 1024 / 1024).toFixed(2),
    cloudinary_backup: `https://res.cloudinary.com/${CLOUDINARY.cloud_name}/raw/upload/v1/backups/`,
    includes: [
      'MongoDB database dump (all 43 collections) via Railway API',
      'Backend source code (no node_modules)',
      'Frontend source code (no node_modules, no dist)',
      'Environment files (.env, .env.production)',
      'Uploaded images and assets',
      'Git info and recent commits',
      'Data JSON exports',
    ],
  }
  fs.writeFileSync(path.join(BACKUP_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`  Backup folder: ${(backupSize / 1024 / 1024).toFixed(2)} MB\n`)

  // Step 4: Upload database backup to Cloudinary
  console.log('[4/5] Uploading database backup to Cloudinary...')
  if (fs.existsSync(ZIP_PATH)) {
    const publicId = `backups/the-outnet-db-${DATE}`
    const uploadResult = await uploadToCloudinary(ZIP_PATH, publicId)
    if (uploadResult.secure_url) {
      console.log(`  Uploaded DB backup: ${uploadResult.secure_url}`)
      console.log(`  Size: ${(uploadResult.bytes / 1024 / 1024).toFixed(2)} MB`)
      manifest.cloudinary_db_url = uploadResult.secure_url
    } else {
      console.error('  DB upload failed:', JSON.stringify(uploadResult))
    }
  }

  console.log('[5/5] Uploading backup parts to GitHub Release...')
  const tagName = `backup-${DATE}`
  try {
    execSync(`gh release create "${tagName}" --title "Full Backup ${DATE}" --notes "Full website backup of The Outnet Wholesale generated on ${DATE}. DB is on Cloudinary."`, { cwd: ROOT, timeout: 15000, stdio: 'pipe' })
    console.log(`  Created release: ${tagName}`)
  } catch (e) {
    console.log(`  Release may already exist: ${e.stderr?.toString()?.slice(0,100) || e.message}`)
  }

  const releaseAssets = []
  if (fs.existsSync(ZIP_PATH)) {
    console.log('  Uploading DB backup to release...')
    try {
      execSync(`gh release upload "${tagName}" "${ZIP_PATH}" --clobber`, { cwd: ROOT, timeout: 60000, stdio: 'pipe' })
      releaseAssets.push('DB backup zip')
      console.log('    Uploaded DB backup')
    } catch (e) { console.log('    DB upload failed:', e.message) }
  }

  const uploadsZip = path.join(ROOT, 'backups', `uploads-${DATE}.zip`)
  if (!fs.existsSync(uploadsZip)) {
    console.log('  Zipping uploads folder...')
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(uploadsZip)
      const archive = archiver('zip', { zlib: { level: 1 } })
      output.on('close', resolve)
      archive.on('error', reject)
      archive.pipe(output)
      archive.directory(path.join(ROOT, 'backend', 'uploads'), 'uploads')
      archive.finalize()
    })
  }
  if (fs.existsSync(uploadsZip)) {
    const uSize = (fs.statSync(uploadsZip).size / 1024 / 1024).toFixed(2)
    console.log(`  Uploads zip: ${uSize} MB`)
    console.log('  Uploading uploads to release...')
    try {
      execSync(`gh release upload "${tagName}" "${uploadsZip}" --clobber`, { cwd: ROOT, timeout: 600000, stdio: 'pipe' })
      releaseAssets.push('uploads zip')
      console.log('    Uploaded uploads')
    } catch (e) { console.log('    Uploads upload failed:', e.message) }
  }

  const backendZip = path.join(ROOT, 'backups', `backend-src-${DATE}.zip`)
  if (!fs.existsSync(backendZip)) {
    console.log('  Zipping backend source...')
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(backendZip)
      const archive = archiver('zip', { zlib: { level: 1 } })
      output.on('close', resolve)
      archive.on('error', reject)
      archive.pipe(output)
      archive.directory(path.join(ROOT, 'backend'), 'backend')
      archive.finalize()
    })
  }
  if (fs.existsSync(backendZip)) {
    const bSize = (fs.statSync(backendZip).size / 1024 / 1024).toFixed(2)
    console.log(`  Backend zip: ${bSize} MB`)
    try {
      execSync(`gh release upload "${tagName}" "${backendZip}" --clobber`, { cwd: ROOT, timeout: 120000, stdio: 'pipe' })
      releaseAssets.push('backend source')
      console.log('    Uploaded backend source')
    } catch (e) { console.log('    Backend upload failed') }
  }

  const frontendZip = path.join(ROOT, 'backups', `frontend-src-${DATE}.zip`)
  if (!fs.existsSync(frontendZip)) {
    console.log('  Zipping frontend source...')
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(frontendZip)
      const archive = archiver('zip', { zlib: { level: 1 } })
      output.on('close', resolve)
      archive.on('error', reject)
      archive.pipe(output)
      archive.directory(path.join(ROOT, 'frontend'), 'frontend')
      archive.finalize()
    })
  }
  if (fs.existsSync(frontendZip)) {
    const fSize = (fs.statSync(frontendZip).size / 1024 / 1024).toFixed(2)
    console.log(`  Frontend zip: ${fSize} MB`)
    try {
      execSync(`gh release upload "${tagName}" "${frontendZip}" --clobber`, { cwd: ROOT, timeout: 180000, stdio: 'pipe' })
      releaseAssets.push('frontend source')
      console.log('    Uploaded frontend source')
    } catch (e) { console.log('    Frontend upload failed') }
  }

  manifest.github_release = `https://github.com/erdemmarshall1/lazada-backend/releases/tag/${tagName}`
  manifest.github_release_assets = releaseAssets
  fs.writeFileSync(path.join(BACKUP_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`\n=== Backup complete (${elapsed}s) ===`)
  console.log(`GitHub Release: ${manifest.github_release}`)
  console.log(`Cloud DB backup: ${manifest.cloudinary_db_url || 'FAILED'}`)
  console.log(`Uploaded assets: ${releaseAssets.join(', ') || 'none'}`)
}

main().catch(err => { console.error('FATAL:', err); process.exit(1) })
