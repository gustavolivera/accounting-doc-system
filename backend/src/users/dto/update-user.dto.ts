import { IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'O E-mail informado não é válido' })
  @IsNotEmpty({ message: 'O E-mail é obrigatório' })
  email: string;

  @ApiProperty({ example: 'newpassword123', required: false })
  @IsOptional()
  @MinLength(6, { message: 'A Senha deve ter no mínimo 6 caracteres' })
  password?: string;
}
