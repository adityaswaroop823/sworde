import type { SwordeAPI } from './index'

declare global {
  interface Window {
    sworde: SwordeAPI
  }
}

export {}
