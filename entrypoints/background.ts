import {browser} from 'wxt/browser'

interface BlockedSitesResponse {
  blocked_sites: string[]
}

export default defineBackground(() => {
  const state = {active: true}
  let cachedBlockedSites: string[] = []

  const getLocalStorage = async (): Promise<BlockedSitesResponse> => {
    const {blocked_sites = []} = await browser.storage.local.get([
      'blocked_sites',
    ])
    return {blocked_sites} // Ensure the return type matches BlockedSitesResponse
  }

  const extractDomainFromUrl = (url: string): string => {
    const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/im
    const match = regex.exec(url)
    const domain = match ? match[1] : ''
    console.log('Extracted domain:', domain) // Log the extracted domain
    return domain
  }

  const redirectToBlockedPage = async (tabId: number, url: string) => {
    const blockedPage = browser.runtime.getURL('/block.html') + `?url=${url}` // Encode the URL

    console.log('Redirecting to blocked page:', blockedPage)

    await browser.tabs.update(tabId, {url: blockedPage})
  }

  const initializeBlockedSites = async () => {
    const result = await getLocalStorage()
    cachedBlockedSites = result.blocked_sites || []
  }

  const handleBlockSite = async (
    domain: string,
    sendResponse: (response: any) => void
  ) => {
    if (!cachedBlockedSites.includes(domain)) {
      cachedBlockedSites.push(domain)
      await browser.storage.local.set({blocked_sites: cachedBlockedSites})
      console.log('Blocked sites:', JSON.stringify(cachedBlockedSites))
      const tabs = await browser.tabs.query({active: true, currentWindow: true})
      if (tabs[0]?.id) {
        await redirectToBlockedPage(tabs[0].id, tabs[0].url || '')
      }
      sendResponse({message: 'site blocked'})
    }
  }

  function extractUrlParameter(url: string, name: string) {
    const match = RegExp('[?&]' + name + '=([^&]*)').exec(url)
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '))
  }

  const handleUnblockSite = async (
    domain: string,
    sendResponse: (response: any) => void
  ) => {
    // Ensure the domain is removed from the cached blocked sites
    cachedBlockedSites = cachedBlockedSites.filter((site) => site !== domain)
    await browser.storage.local.set({blocked_sites: cachedBlockedSites})
    console.log(
      'Blocked sites after unblocking:',
      JSON.stringify(cachedBlockedSites)
    )

    const tabs = await browser.tabs.query({active: true, currentWindow: true})
    if (tabs[0]?.id) {
      const url = extractUrlParameter(tabs[0].url || '', 'url') // Extract the original URL from the blocked page

      // Redirect to the original site after unblocking
      await browser.tabs.update(tabs[0].id, {
        url: url || tabs[0].url || '',
      }) // Use the original URL or a default
    }
    sendResponse({message: 'site unblocked'})
  }

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'block-site') {
      handleBlockSite(message.data.domain, sendResponse)
    } else if (message.type === 'unblock-site') {
      handleUnblockSite(message.data.domain, sendResponse)
    }
    return true // Keep the message channel open for sendResponse
  })

  browser.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await browser.tabs.get(activeInfo.tabId)
    const domain = extractDomainFromUrl(tab.url || '')
    const result = await getLocalStorage()
    const isBlocked = result.blocked_sites?.some((site) =>
      domain.includes(site)
    )
    if (isBlocked && state.active && tab.id) {
      await redirectToBlockedPage(tab.id, tab.url || '')
    }
  })

  browser.tabs.onCreated.addListener(async (tab) => {
    const domain = extractDomainFromUrl(tab.url || '')
    const result = await getLocalStorage()
    const isBlocked = result.blocked_sites?.some((site) =>
      domain.includes(site)
    )
    if (isBlocked && state.active && tab.id) {
      await redirectToBlockedPage(tab.id, tab.url || '')
    }
  })

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // if browser tab is updated and the url is in the blocked sites list, redirect to blocked page
    if (changeInfo.url) {
      const domain = extractDomainFromUrl(changeInfo.url)
      const result = await getLocalStorage()
      const isBlocked = result.blocked_sites?.some((site) =>
        domain.includes(site)
      )
      if (isBlocked && state.active) {
        await redirectToBlockedPage(tabId, changeInfo.url)
      }
    }
  })

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.blocked_sites) {
      cachedBlockedSites = changes.blocked_sites.newValue || []

      // block page when updated url is blocked
      browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        if (tabs[0]?.id) {
          const domain = extractDomainFromUrl(tabs[0].url || '')
          if (cachedBlockedSites.some((site) => domain.includes(site))) {
            redirectToBlockedPage(tabs[0].id, tabs[0].url || '')
          }
        }
      })

      console.log('Blocked sites:', JSON.stringify(cachedBlockedSites))
    }
  })

  // Initialize blocked sites on startup
  initializeBlockedSites()
})
