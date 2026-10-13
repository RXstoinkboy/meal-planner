import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'

import { PrismaService } from '@/common/database/prisma.service'
import { X_USER_ID_HEADER } from '@/common/identity/current-user.decorator'

const UNIQUE_CONSTRAINT = 'P2002'

type CreateUserInput = { email: string; fullName: string | null }

/** Owns the `users` table. The slice's only cross-slice export. */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput) {
    try {
      return await this.prisma.user.create({ data: input })
    } catch (error) {
      const isDuplicateEmail = (error as { code?: string }).code === UNIQUE_CONSTRAINT

      if (isDuplicateEmail) {
        throw new ConflictException('The email has already been taken')
      }

      throw error
    }
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  /** Identity check for the `X-User-Id` seam: an unknown id is a 401, not a 404. */
  async requireById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } })

    if (!user) {
      throw new UnauthorizedException(`Unknown user for ${X_USER_ID_HEADER}`)
    }

    return user
  }
}
