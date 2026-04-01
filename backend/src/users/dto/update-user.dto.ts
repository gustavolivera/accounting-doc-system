import { IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'newpassword123', required: false })
  @IsOptional()
  @MinLength(6)
  password?: string;
}
