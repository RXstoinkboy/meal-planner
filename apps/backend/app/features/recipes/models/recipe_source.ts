import { RecipeSourceSchema } from '#database/schema'

export default class RecipeSource extends RecipeSourceSchema {
  declare kind: 'link' | 'video' | 'book'
}
