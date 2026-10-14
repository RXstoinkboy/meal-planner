import { ConflictException, Injectable } from '@nestjs/common'

import { PrismaService } from '@/core/database/prisma.service'

const UNIQUE_CONSTRAINT = 'P2002'

type SignupInput = { email: string; fullName: string | null }

/** Signup process: create the user; a duplicate email becomes 409. */
@Injectable()
export class SignupService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: SignupInput) {
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
}
