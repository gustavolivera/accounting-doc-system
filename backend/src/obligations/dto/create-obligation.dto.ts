import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  ValidateNested,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DeadlineType, Periodicity, ConditionOperator } from '@prisma/client';

class ObligationConditionDto {
  @ApiProperty({ description: 'Field field name in Company model' })
  @IsString({ message: 'O campo é inválido' })
  @IsNotEmpty({ message: 'O campo é obrigatório' })
  field: string;

  @ApiProperty({ enum: ConditionOperator })
  @IsEnum(ConditionOperator)
  operator: ConditionOperator;

  @ApiProperty({ description: 'Value to compare' })
  @IsString({ message: 'O valor deve ser um texto' })
  @IsNotEmpty({ message: 'O valor é obrigatório' })
  value: string;
}

export class CreateObligationDto {
  @ApiProperty()
  @IsString({ message: 'O Nome da Obrigação deve ser um texto' })
  @IsNotEmpty({ message: 'O Nome da Obrigação é obrigatório' })
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: DeadlineType })
  @IsEnum(DeadlineType)
  type: DeadlineType;

  @ApiProperty({ enum: Periodicity })
  @IsEnum(Periodicity)
  periodicity: Periodicity;

  @ApiProperty({ description: 'Fixed day of month for due date (1-31)' })
  @IsInt({ message: 'O Dia de Vencimento deve ser um número inteiro' })
  @Min(1, { message: 'O Dia de Vencimento deve ser no mínimo 1' })
  @Max(31, { message: 'O Dia de Vencimento deve ser no máximo 31' })
  dueDay: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    type: [ObligationConditionDto],
    description: 'List of conditions',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ObligationConditionDto)
  @IsOptional()
  conditions?: ObligationConditionDto[];
}
