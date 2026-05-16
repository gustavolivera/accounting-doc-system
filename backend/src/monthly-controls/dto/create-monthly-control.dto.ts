import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus } from '@prisma/client';

export class CreateMonthlyControlDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  month: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  year: number;

  @ApiProperty({ enum: DocumentStatus })
  @IsEnum(DocumentStatus)
  @IsNotEmpty()
  status: DocumentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observation?: string;
}
