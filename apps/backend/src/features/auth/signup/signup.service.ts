import { ConflictException, Injectable } from '@nestjs/common'
import { PasswordHasher } from '@nestjs/authentication'

import { PrismaService } from '@/core/database/prisma.service'

const UNIQUE_CONSTRAINT = 'P2002'

type SignupInput = { email: string; fullName: string | null; password: string }

@Injectable()
export class SignupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async create(input: SignupInput) {
    const passwordHash = await this.passwordHasher.hash(input.password)

    try {
      return await this.prisma.user.create({
        data: { email: input.email, fullName: input.fullName, passwordHash },
        omit: { passwordHash: true },
      })
    } catch (error) {
      const isDuplicateEmail = (error as { code?: string }).code === UNIQUE_CONSTRAINT

      if (isDuplicateEmail) {
        throw new ConflictException('The email has already been taken')
      }

      throw error
    }
  }
}
