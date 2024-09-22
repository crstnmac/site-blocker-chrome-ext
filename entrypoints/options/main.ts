import {browser} from 'wxt/browser/chrome' // Replace 'your-browser-library' with the appropriate library name

interface BlockedSitesResponse {
  blocked_sites: string[]
}

// this is a options page show all the blocked sites and allow user to add or remove blocked sites

let state: {
  blockedSites: string[]
} = {blockedSites: []}

const getLocalStorage = async (): Promise<BlockedSitesResponse> => {
  const {blocked_sites = []} = await browser.storage.local.get([
    'blocked_sites',
  ])
  return {blocked_sites} // Ensure the return type matches BlockedSitesResponse
}

const updateBlockedSites = async () => {
  const {blocked_sites} = await getLocalStorage()
  state.blockedSites = blocked_sites
}

const handleRemoveBlockedSite = async (domain: string) => {
  const {blocked_sites} = await getLocalStorage()
  const updatedBlockedSites = blocked_sites.filter((site) => site !== domain)
  await browser.storage.local.set({blocked_sites: updatedBlockedSites})
  await updateBlockedSites()
}

/// show all the blocked sites in the options page

const renderBlockedSites = () => {
  const blockedSitesContainer = document.getElementById('blocked-sites')
  if (!blockedSitesContainer) return

  blockedSitesContainer.innerHTML = ''

  state.blockedSites.forEach((site) => {
    const siteElement = document.createElement('div')
    siteElement.innerHTML = site
    const removeButton = document.createElement('button')
    removeButton.innerText = 'Remove'
    removeButton.onclick = async () => {
      await handleRemoveBlockedSite(site)
    }
    siteElement.appendChild(removeButton)
    blockedSitesContainer.appendChild(siteElement)
  })
}

const initBlockedSites = async () => {
  const {blocked_sites} = await getLocalStorage()
  state.blockedSites = blocked_sites
  renderBlockedSites()
}

const init = async () => {
  await initBlockedSites()
}

init()
