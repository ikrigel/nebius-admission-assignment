/**
 * API service for calling the backend summarize endpoint.
 */

import { StorageService } from './storage'

class ApiServiceClass {
  async summarize(githubUrl) {
    console.log('🟦 [API] Starting summarize request...')

    const settings = StorageService.getSettings()
    const githubToken = StorageService.getGithubToken()

    console.log('🟦 [API] Settings:', settings)
    console.log('🟦 [API] GitHub Token:', githubToken ? '***' : 'None')

    const headers = {
      'Content-Type': 'application/json',
    }

    // Pass user's provider preference and API key to backend
    if (settings.activeProvider) {
      headers['X-Provider'] = settings.activeProvider
      console.log('🟦 [API] Provider:', settings.activeProvider)
    }
    if (settings.keys[settings.activeProvider]) {
      headers['X-Api-Key'] = settings.keys[settings.activeProvider]
      console.log('🟦 [API] API Key provided: ***')
    } else {
      console.warn('🟨 [API] No API key found for provider:', settings.activeProvider)
    }
    // Pass GitHub token if available
    if (githubToken) {
      headers['X-Github-Token'] = githubToken
      console.log('🟦 [API] GitHub Token header set: ***')
    }

    console.log('🟦 [API] Headers:', {
      ...headers,
      'X-Api-Key': headers['X-Api-Key'] ? '***' : undefined,
      'X-Github-Token': headers['X-Github-Token'] ? '***' : undefined
    })

    // Get base URL (works for both local dev and production)
    const baseUrl = window.location.origin
    const endpoint = `${baseUrl}/api/summarize`

    console.log('🟦 [API] Endpoint:', endpoint)
    console.log('🟦 [API] Request body:', { github_url: githubUrl })

    try {
      console.log('🟦 [API] Sending POST request...')
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ github_url: githubUrl }),
      })

      console.log('🟦 [API] Response status:', response.status)
      console.log('🟦 [API] Response OK:', response.ok)
      console.log('🟦 [API] Response headers:', {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length'),
      })

      const data = await response.json()
      console.log('🟦 [API] Response data:', data)

      if (!response.ok) {
        console.error('🔴 [API] Request failed:', response.status, data)
        throw new Error(
          data.message || data.detail || data.error || `HTTP ${response.status}`
        )
      }

      console.log('✅ [API] Request successful')
      return data
    } catch (error) {
      console.error('🔴 [API] Error:', error.message)
      console.error('🔴 [API] Stack:', error.stack)
      throw new Error(error.message || 'Failed to summarize repository')
    }
  }
}

export const ApiService = new ApiServiceClass()
