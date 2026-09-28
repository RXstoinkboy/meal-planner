/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.auth.NewAccount, 'store'])
        router.post('login', [controllers.auth.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.profile.Profile, 'show'])
        router.post('logout', [controllers.auth.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('/', [controllers.recipes.Recipes, 'index']).as('index')
        router.get(':id', [controllers.recipes.Recipes, 'show']).as('show')
        router.post('/', [controllers.recipes.Recipes, 'store']).as('store')
        router.patch(':id', [controllers.recipes.Recipes, 'update']).as('update')
        router.delete(':id', [controllers.recipes.Recipes, 'destroy']).as('destroy')
      })
      .where('id', router.matchers.number())
      .prefix('recipes')
      .as('recipes')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
