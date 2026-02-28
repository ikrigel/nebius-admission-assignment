/**
 * API service for calling the backend summarize endpoint.
 */

import { StorageService } from './storage'

class ApiServiceClass {
  async summarize(githubUrl) {
    const settings = StorageService.getSettings()

    const headers = {
      'Content-Type': 'application/json',
    }

    // Pass user's provider preference and API key to backend
    if (settings.activeProvider) {
      headers['X-Provider'] = settings.activeProvider
    }
    if (settings.keys[settings.activeProvider]) {
      headers['X-Api-Key'] = settings.keys[settings.activeProvider]
    }

    // Get base URL (works for both local dev and production)
    const baseUrl = window.location.origin

    try {
      const response = await fetch(`${baseUrl}/api/summarize`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ github_url: githubUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `HTTP ${response.status}`
        )
      }

      return data
    } catch (error) {
      throw new Error(error.message || 'Failed to summarize repository')
    }
  }
}

export const ApiService = new ApiServiceClass()
