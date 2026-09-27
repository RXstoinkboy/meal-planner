import { RecipeSchema } from '#database/schema'

export default class Recipe extends RecipeSchema {
  declare sourceType: 'manual' | 'link' | 'image' | 'pdf' | 'suggestion'
  declare tags: string[]
  declare tools: string[]
}
