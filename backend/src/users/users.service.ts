import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createUserDto: CreateUserDto, executorId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
      },
    });

    await this.auditService.logAction(executorId, 'CREATE', 'USER', user.id, {
      email: user.email,
    });

    const { password, ...result } = user;
    return result;
  }

  async findAll(page: number = 1, limit: number = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(({ password, ...user }) => user),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto, executorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: any = { email: updateUserDto.email };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    await this.auditService.logAction(
      executorId,
      'UPDATE',
      'USER',
      updatedUser.id,
      { email: updatedUser.email },
    );

    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: string, executorId: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (user) {
        await this.prisma.user.delete({ where: { id } });
        await this.auditService.logAction(executorId, 'DELETE', 'USER', id, {
          email: user.email,
        });
      }
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }
}
