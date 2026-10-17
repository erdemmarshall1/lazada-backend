// Robust "login as user/seller" tab handling.
// A scripted window.open() after an `await` is blocked by most mobile browsers
// (and sometimes desktop), so we open the tab SYNCHRONOUSLY on click (while the
// user-activation is still valid) and only navigate it once the token arrives.
// If the popup is still blocked we fall back to navigating the current tab.

export const preOpenImpersonationTab = () => {
  try {
    return window.open('about:blank', '_blank')
  } catch {
    return null
  }
}

export const closeImpersonationTab = (win) => {
  try {
    if (win && !win.closed) win.close()
  } catch {}
}

export const openImpersonation = (win, userPath, token) => {
  const base = userPath || '/myaccount'
  const url = `${base}?temp_token=${encodeURIComponent(token)}`
  if (win && !win.closed) {
    try {
      win.location.href = url
      if (win.focus) win.focus()
      return 'tab'
    } catch {}
  }
  window.location.assign(url)
  return 'same-tab'
}
