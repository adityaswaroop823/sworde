const { spawn, execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const https = require('https')

const REPO = 'adityaswaroop823/sworde'
const APP_NAME = 'Sworde'

const HOME = os.homedir()
const CACHE_DIR = path.join(HOME, '.sworde', 'cli-cache')

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function macAppPath() {
  const userPath = path.join(HOME, 'Applications', `${APP_NAME}.app`)
  const sysPath = path.join('/Applications', `${APP_NAME}.app`)
  if (fs.existsSync(sysPath)) return sysPath
  if (fs.existsSync(userPath)) return userPath
  return null
}

function winAppPath() {
  const local = process.env.LOCALAPPDATA || path.join(HOME, 'AppData', 'Local')
  const candidates = [
    path.join(local, 'Programs', APP_NAME.toLowerCase(), `${APP_NAME}.exe`),
    path.join(local, 'Programs', APP_NAME, `${APP_NAME}.exe`)
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

function isInstalled() {
  if (process.platform === 'darwin') return Boolean(macAppPath())
  if (process.platform === 'win32') return Boolean(winAppPath())
  return false
}

function pickAsset(assets) {
  const plat = process.platform
  const arch = process.arch
  if (plat === 'darwin') {
    return assets.find((a) => /mac.*\.dmg$/i.test(a.name) && a.name.includes(arch))
      || assets.find((a) => /\.dmg$/i.test(a.name))
  }
  if (plat === 'win32') {
    return assets.find((a) => /win.*\.exe$/i.test(a.name) && a.name.includes(arch))
      || assets.find((a) => /win.*\.exe$/i.test(a.name))
  }
  return null
}

function get(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'sworde-cli',
          Accept: 'application/octet-stream'
        }
      },
      (res) => {
        if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && res.headers.location) {
          if (redirects <= 0) return reject(new Error('Too many redirects'))
          res.resume()
          resolve(get(res.headers.location, redirects - 1))
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`))
          return
        }
        resolve(res)
      }
    )
    req.on('error', reject)
  })
}

async function fetchJson(url) {
  const res = await get(url)
  const chunks = []
  for await (const c of res) chunks.push(c)
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'))
}

async function downloadTo(url, dest) {
  const res = await get(url)
  const total = Number(res.headers['content-length']) || 0
  return new Promise((resolve, reject) => {
    const tmp = `${dest}.partial`
    const out = fs.createWriteStream(tmp)
    let received = 0
    let lastPct = -1
    res.on('data', (chunk) => {
      received += chunk.length
      if (total > 0) {
        const pct = Math.floor((received / total) * 100)
        if (pct !== lastPct && pct % 5 === 0) {
          process.stdout.write(`\r  ↓ ${pct}% (${(received / 1e6).toFixed(1)} / ${(total / 1e6).toFixed(1)} MB)`)
          lastPct = pct
        }
      }
    })
    res.pipe(out)
    out.on('finish', () => {
      out.close(() => {
        process.stdout.write('\n')
        fs.renameSync(tmp, dest)
        resolve(dest)
      })
    })
    out.on('error', reject)
    res.on('error', reject)
  })
}

async function downloadInstaller() {
  console.log(`→ Fetching latest Sworde release from github.com/${REPO}…`)
  const release = await fetchJson(`https://api.github.com/repos/${REPO}/releases/latest`)
  const asset = pickAsset(release.assets || [])
  if (!asset) {
    throw new Error(`No installer found for ${process.platform}/${process.arch} in release ${release.tag_name}`)
  }
  ensureDir(CACHE_DIR)
  const dest = path.join(CACHE_DIR, asset.name)
  if (fs.existsSync(dest) && fs.statSync(dest).size === asset.size) {
    console.log(`→ Using cached installer: ${asset.name}`)
    return dest
  }
  console.log(`→ Downloading ${asset.name} (${(asset.size / 1e6).toFixed(1)} MB)…`)
  await downloadTo(asset.browser_download_url, dest)
  return dest
}

async function installMac(dmgPath) {
  console.log('→ Mounting DMG…')
  const attachOut = execFileSync('/usr/bin/hdiutil', ['attach', '-nobrowse', '-noautoopen', dmgPath], {
    encoding: 'utf-8'
  })
  const mountLine = attachOut.split('\n').find((l) => l.includes('/Volumes/'))
  if (!mountLine) throw new Error('Could not determine DMG mount point')
  const mountPoint = mountLine.split('\t').pop().trim()
  const appInDmg = path.join(mountPoint, `${APP_NAME}.app`)
  if (!fs.existsSync(appInDmg)) throw new Error(`${APP_NAME}.app not found in DMG`)

  const sysTarget = '/Applications'
  const userTarget = path.join(HOME, 'Applications')
  let target = sysTarget
  try {
    fs.accessSync(sysTarget, fs.constants.W_OK)
  } catch {
    ensureDir(userTarget)
    target = userTarget
  }
  const destApp = path.join(target, `${APP_NAME}.app`)
  if (fs.existsSync(destApp)) {
    console.log(`→ Removing previous install at ${destApp}…`)
    fs.rmSync(destApp, { recursive: true, force: true })
  }
  console.log(`→ Installing to ${destApp}…`)
  execFileSync('/bin/cp', ['-R', appInDmg, target])
  try {
    execFileSync('/usr/bin/xattr', ['-cr', destApp])
  } catch {
    // best-effort
  }
  try {
    execFileSync('/usr/bin/hdiutil', ['detach', mountPoint, '-quiet'])
  } catch {
    // best-effort
  }
  return destApp
}

function installWindows(exePath) {
  console.log('→ Running installer (silent)…')
  // /S is the NSIS silent flag; per-user install needs no elevation
  execFileSync(exePath, ['/S'], { stdio: 'inherit' })
  const installed = winAppPath()
  if (!installed) throw new Error('Installer ran but Sworde executable not found afterward')
  return installed
}

function launchMac(appPath) {
  console.log(`→ Launching ${APP_NAME}…`)
  spawn('/usr/bin/open', ['-a', appPath], { detached: true, stdio: 'ignore' }).unref()
}

function launchWindows(exePath) {
  console.log(`→ Launching ${APP_NAME}…`)
  spawn(exePath, [], { detached: true, stdio: 'ignore' }).unref()
}

async function run() {
  console.log(`\n  ⚔  Sworde launcher`)
  const platform = process.platform
  if (platform !== 'darwin' && platform !== 'win32') {
    console.error(`✖ Sworde npm launcher currently supports macOS and Windows only.`)
    console.error(`  For Linux, build from source: https://github.com/${REPO}`)
    process.exit(1)
  }

  if (!isInstalled()) {
    console.log(`→ ${APP_NAME} not installed yet — installing for the first time…\n`)
    const installer = await downloadInstaller()
    if (platform === 'darwin') {
      const appPath = await installMac(installer)
      console.log(`✔ Installed to ${appPath}\n`)
      launchMac(appPath)
    } else {
      const exePath = installWindows(installer)
      console.log(`✔ Installed to ${exePath}\n`)
      launchWindows(exePath)
    }
    console.log(`\n  Next time, just run: sworde`)
    return
  }

  if (platform === 'darwin') {
    launchMac(macAppPath())
  } else {
    launchWindows(winAppPath())
  }
}

module.exports = { run }
