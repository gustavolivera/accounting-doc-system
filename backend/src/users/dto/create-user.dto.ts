import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'O E-mail informado não é válido' })
  @IsNotEmpty({ message: 'O E-mail é obrigatório' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'A Senha é obrigatória' })
  @MinLength(6, { message: 'A Senha deve ter no mínimo 6 caracteres' })
  password: string;
}
