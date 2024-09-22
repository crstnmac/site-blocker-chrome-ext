import {browser} from 'wxt/browser/chrome' // Replace 'your-browser-library' with the appropriate library name

// Saves options to chrome.storage
function saveOptions() {
  const workDuration = (document.getElementById('workDuration') as HTMLInputElement)?.value || '25';
  const blockedSites = (document.getElementById('blockedSites') as HTMLTextAreaElement)?.value.split('\n') || [];

  // Calculate break duration based on user-defined work duration
  const breakDuration = Math.ceil(parseInt(workDuration) / 4); // Example: 1 break for every 4 work minutes

  const focusModeSettings = {
    init: false,
    breakTime: false,
    default: {
      focus_time: parseInt(workDuration),
      break_time: breakDuration,
      number_cycle: 5,
    },
    remaining: {
      number_cycle: 5,
    },
  };

  browser.storage.sync.set({
    blockedSites: blockedSites,
    pomodoroSettings: {
      workDuration: parseInt(workDuration),
      breakDuration: breakDuration,
      longBreakDuration: 15, // Keep default or allow user input
      longBreakInterval: 4,   // Keep default or allow user input
    },
    focus_mode: focusModeSettings,
  }, () => {
    const status = document.getElementById('status')!;
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  browser.storage.sync.get(
    {
      blockedSites: [],
      pomodoroSettings: {
        workDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
      },
      focus_mode: {
        init: false,
        breakTime: false,
        default: {
          focus_time: 36,
          break_time: 5,
          number_cycle: 5,
        },
        remaining: {
          number_cycle: 5,
        },
      },
    },
    (items: {
      blockedSites: string[]
      pomodoroSettings: {
        workDuration: number
        breakDuration: number
        longBreakDuration: number
        longBreakInterval: number
      }
      focus_mode: {
        init: boolean
        breakTime: boolean
        default: {
          focus_time: number
          break_time: number
          number_cycle: number
        }
        remaining: {
          number_cycle: number
        }
      }
    }) => {
      ; (document.getElementById('blockedSites') as HTMLInputElement).value =
        items.blockedSites.join('\n')
        ; (document.getElementById('workDuration') as HTMLInputElement).value =
          items.pomodoroSettings.workDuration.toString()
        ; (document.getElementById('breakDuration') as HTMLInputElement).value =
          items.pomodoroSettings.breakDuration.toString()
        ; (
          document.getElementById('longBreakDuration') as HTMLInputElement
        ).value = items.pomodoroSettings.longBreakDuration.toString()
        ; (
          document.getElementById('longBreakInterval') as HTMLInputElement
        ).value = items.pomodoroSettings.longBreakInterval.toString()
    }
  )
}

function connectService(service: string) {
  // Implement OAuth flow for the selected service
  console.log(`Connecting to ${service}...`)
  // This is a placeholder. You would typically initiate an OAuth flow here.
  alert(
    `${service} connection initiated. Please complete the authorization process.`
  )
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('saveOptions')?.addEventListener('click', saveOptions)
document
  .getElementById('connectTodoist')
  ?.addEventListener('click', () => connectService('Todoist'))
document
  .getElementById('connectTrello')
  ?.addEventListener('click', () => connectService('Trello'))
document
  .getElementById('connectJira')
  ?.addEventListener('click', () => connectService('Jira'))
