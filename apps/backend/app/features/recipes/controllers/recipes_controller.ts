import type { HttpContext } from '@adonisjs/core/http'

export default class RecipesController {
  async index({ serialize }: HttpContext) {
    return serialize([])
  }
}
