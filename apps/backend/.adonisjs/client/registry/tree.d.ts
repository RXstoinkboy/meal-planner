/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
  }
  recipes: {
    index: typeof routes['recipes.index']
    show: typeof routes['recipes.show']
    store: typeof routes['recipes.store']
    update: typeof routes['recipes.update']
    destroy: typeof routes['recipes.destroy']
  }
}
