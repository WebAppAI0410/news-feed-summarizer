// Add custom jest matchers from @testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  OPENAI_API_KEY: 'test-api-key',
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
      replace: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})