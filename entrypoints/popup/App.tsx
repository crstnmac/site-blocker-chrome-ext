import './App.css'
import {useState, useEffect} from 'react'
import {browser} from 'wxt/browser'

function App() {
  const [isBlocked, setIsBlocked] = useState<boolean>(false)
  const [url, setUrl] = useState<string>('')
  const [blockedUrl, setBlockedUrl] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const fetchCurrentTabUrl = async () => {
      const tabs = await browser.tabs.query({active: true, currentWindow: true})

      if (tabs[0]?.url) {
        if (tabs[0].url.includes('chrome-extension://')) {
          const urlParam = new URLSearchParams(tabs[0].url.split('?')[1])

          console.log(urlParam.get('url'))
          const extractedUrl = extractDomain(urlParam.get('url') || '')

          setUrl(extractedUrl)
          setBlockedUrl(extractedUrl)
          setIsBlocked(true)
        } else {
          setUrl(tabs[0].url)
        }
      }
    }

    const fetchBlockedSites = async () => {
      const response = await browser.runtime.sendMessage({
        type: 'get-blocked-sites',
      })
      const blockedSites = response.data || []
      const domain = extractDomain(url)
      const isBlocked = blockedSites.some((site: string) =>
        domain.includes(site)
      )
      setIsBlocked(isBlocked)
      if (isBlocked) {
        setBlockedUrl(url)
      }

      console.log('fetching data app.tsx', url, blockedUrl)
    }

    fetchCurrentTabUrl()
    fetchBlockedSites()
  }, [url]) // Added url as a dependency to re-fetch blocked sites when it changes

  const handleBlockSite = async () => {
    const domain = extractDomain(url)

    console.log('Blocking site app.tsx:', domain)
    console.log('Current URL app.tsx:', url)

    await browser.runtime.sendMessage({type: 'block-site', data: {domain}})
    setIsBlocked(true)
    setBlockedUrl(url)
  }

  const handleUnblockSite = async () => {
    const domain = extractDomain(blockedUrl)

    console.log('Unblocking site app.tsx:', domain)
    console.log('Blocked URL app.tsx:', blockedUrl)

    await browser.runtime.sendMessage({type: 'unblock-site', data: {domain}})
    setIsBlocked(false)
    setBlockedUrl('')
  }

  const extractDomain = (url: string): string => {
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^:/\n?]+)/)
    return match ? match[1] : ''
  }

  return (
    <div className="block-site-container">
      <h1>{isBlocked ? 'Site Blocked' : 'Block Site'}</h1>
      <p>Current URL: {url}</p>
      {isBlocked ? (
        <div>
          <button onClick={handleUnblockSite}>Unblock Site</button>
          {errorMessage && <p className="error">{errorMessage}</p>}
        </div>
      ) : (
        <button onClick={handleBlockSite}>Block Site</button>
      )}
    </div>
  )
}

export default App
