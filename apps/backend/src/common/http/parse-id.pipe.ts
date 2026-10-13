import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common'

/**
 * Route params are numeric ids. A malformed id used to miss the route matcher
 * entirely (404) — keep that contract instead of Nest's default 400.
 */
@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string) {
    const id = Number(value)
    const isValidId = Number.isInteger(id) && id > 0

    if (!isValidId) {
      throw new NotFoundException('Resource not found')
    }

    return id
  }
}
